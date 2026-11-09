-- =====================================================================
-- UBSTrack — unidades REAIS de pronto atendimento 24 h de Sorocaba
-- Rode com o usuário ADMIN ou de ESCRITA (o do painel é somente leitura).
-- Pode rodar de novo quantas vezes quiser: apaga e recria só estas 5 unidades.
--
-- REAIS: nomes, endereços e horário (24 h). Fonte: carta de serviços da
--   Prefeitura de Sorocaba (Portal 156, "Atendimento em UPA/UPH/PA").
--   Coordenadas conferidas no mapa pela equipe.
-- SIMULADOS: fila e tempo dos atendimentos (não existe dado real de fila).
--   Os dados ficam "desatualizados" após 10 min sem movimento (regra 8);
--   rode de novo o script ou use o modo automático do simulador.
-- Pode ser usado junto com seed_demo.sql (as "UBS Demo" não são tocadas).
-- =====================================================================

BEGIN;

CREATE TEMP TABLE upa (
    nome text, endereco text, lat numeric, lon numeric,
    dur_min int, fila int, minutos_atras int
) ON COMMIT DROP;

INSERT INTO upa VALUES
 ('UPA Éden',                 'R. Miguel José Gimenez, 75 - Vila Gimenes, Sorocaba - SP',     -23.429046258055156, -47.415466571164465, 12, 6, 2),
 ('UPH Zona Oeste',           'Av. Gen. Carneiro, 1670 - Cerrado, Sorocaba - SP',             -23.506710213857335, -47.48360501301564,  10, 3, 1),
 ('UPH Zona Norte',           'Av. Itavuvu, 19 - Vila Olímpia, Sorocaba - SP',                -23.483436336434774, -47.47204696318299,  14, 9, 3),
 ('UPH Zona Leste',           'R. Cel. Nogueira Padilha, 2585 - Vila Hortência, Sorocaba - SP', -23.513177226820844, -47.42993291318191, 8, 0, 2),
 ('PA Parque das Laranjeiras', 'R. Sônia Bernuncio, 24 - Parque das Laranjeiras, Sorocaba - SP', -23.45375358785477, -47.46918104756567, 10, 2, 4);

-- 1) Limpa execuções anteriores (só estas unidades) ----------------------
DELETE FROM atendimento WHERE id_ubs IN (SELECT id_ubs FROM ubs WHERE nome IN (SELECT nome FROM upa));
DELETE FROM ubs_servico WHERE id_ubs IN (SELECT id_ubs FROM ubs WHERE nome IN (SELECT nome FROM upa));
DELETE FROM ubs         WHERE nome IN (SELECT nome FROM upa);

-- 2) Serviço padrão -------------------------------------------------------
INSERT INTO servico (nome)
SELECT 'Atendimento geral'
WHERE NOT EXISTS (SELECT 1 FROM servico WHERE nome = 'Atendimento geral');

-- 3) Unidades (horário nulo = 24 horas) -----------------------------------
INSERT INTO ubs (nome, endereco, latitude, longitude, abre_as, fecha_as)
SELECT nome, endereco, lat, lon, NULL, NULL FROM upa;

INSERT INTO ubs_servico (id_ubs, id_servico)
SELECT u.id_ubs, s.id_servico
FROM ubs u CROSS JOIN servico s
WHERE u.nome IN (SELECT nome FROM upa) AND s.nome = 'Atendimento geral';

-- 4) Histórico: 10 atendimentos finalizados por unidade ------------------
INSERT INTO atendimento (id_ubs, id_servico, codigo_senha, status, entrada, inicio_atendimento, fim_atendimento)
SELECT u.id_ubs, s.id_servico, 'A-' || lpad((t.g + 1)::text, 3, '0'), 'finalizado',
       t.fim - make_interval(mins => c.dur_min + 5),
       t.fim - make_interval(mins => c.dur_min),
       t.fim
FROM upa c
JOIN ubs u     ON u.nome = c.nome
JOIN servico s ON s.nome = 'Atendimento geral'
CROSS JOIN LATERAL (
    SELECT g, now() - make_interval(mins => c.minutos_atras + g * 15) AS fim
    FROM generate_series(0, 9) g
) t;

-- 5) Fila atual: senhas aguardando ---------------------------------------
INSERT INTO atendimento (id_ubs, id_servico, codigo_senha, status, entrada)
SELECT u.id_ubs, s.id_servico, 'A-' || lpad((10 + n)::text, 3, '0'), 'aguardando',
       now() - make_interval(mins => c.minutos_atras)
FROM upa c
JOIN ubs u     ON u.nome = c.nome
JOIN servico s ON s.nome = 'Atendimento geral'
CROSS JOIN generate_series(1, c.fila) AS n;

COMMIT;

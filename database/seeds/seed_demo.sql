-- =====================================================================
-- UBSTrack — dados de DEMONSTRAÇÃO para testar a painel-api
-- Rode com o usuário ADMIN ou de ESCRITA (o do painel é somente leitura).
-- Pode rodar de novo quantas vezes quiser: ele apaga as "UBS Demo" antes.
-- Nomes e endereços são inventados; coordenadas são aproximadas (Sorocaba).
-- =====================================================================
-- Conferido com o database/models.py (tabelas ubs, servico, ubs_servico, atendimento).
-- Se você mudar o modelo (ex.: nova coluna obrigatória), ajuste este script.
-- =====================================================================

BEGIN;

-- 1) Limpa dados de execuções anteriores -------------------------------
DELETE FROM atendimento  WHERE id_ubs IN (SELECT id_ubs FROM ubs WHERE nome LIKE 'UBS Demo%');
DELETE FROM ubs_servico  WHERE id_ubs IN (SELECT id_ubs FROM ubs WHERE nome LIKE 'UBS Demo%');
DELETE FROM ubs          WHERE nome LIKE 'UBS Demo%';

-- 2) Serviço padrão (só cria se ainda não existir) ---------------------
INSERT INTO servico (nome)
SELECT 'Atendimento geral'
WHERE NOT EXISTS (SELECT 1 FROM servico WHERE nome = 'Atendimento geral');

-- 3) Cenários: cada linha testa uma regra do guia ----------------------
--    dur_min       = duração média dos atendimentos do histórico
--    fila          = senhas aguardando agora
--    minutos_atras = há quantos minutos foi o último movimento
CREATE TEMP TABLE cenario (
    nome text, endereco text, lat numeric, lon numeric,
    abre time, fecha time,
    dur_min int, fila int, minutos_atras int
) ON COMMIT DROP;

INSERT INTO cenario VALUES
 -- fila 4 x 10 min = 40 min  -> situação MODERADA
 ('UBS Demo Centro',        'Rua Exemplo, 100',   -23.5015, -47.4526, '00:00','23:59', 10, 4,   2),
 -- fila 0                    -> situação BAIXA
 ('UBS Demo Norte',         'Av. Exemplo, 200',   -23.4700, -47.4400, '00:00','23:59',  8, 0,   3),
 -- fila 8 x 12 min = 96 min  -> situação ALTA
 ('UBS Demo Leste',         'Rua Teste, 300',     -23.5100, -47.4000, '00:00','23:59', 12, 8,   1),
 -- horário nulo = 24 horas
 ('UBS Demo 24 Horas',      'Av. Teste, 400',     -23.5300, -47.4700, NULL,   NULL,    15, 2,   4),
 -- aberta só de 00:00 a 00:01 -> praticamente sempre FECHADA
 ('UBS Demo Fechada',       'Rua Fictícia, 500',  -23.4900, -47.4800, '00:00','00:01', 10, 3,   2),
 -- último movimento há 2 horas -> DESATUALIZADA (vai para o fim)
 ('UBS Demo Desatualizada', 'Rua Fictícia, 600',  -23.5000, -47.4300, '00:00','23:59', 10, 3, 120);

-- 4) Unidades -----------------------------------------------------------
INSERT INTO ubs (nome, endereco, latitude, longitude, abre_as, fecha_as)
SELECT nome, endereco, lat, lon, abre, fecha FROM cenario;

INSERT INTO ubs_servico (id_ubs, id_servico)
SELECT u.id_ubs, s.id_servico
FROM ubs u CROSS JOIN servico s
WHERE u.nome LIKE 'UBS Demo%' AND s.nome = 'Atendimento geral';

-- 5) Histórico: 10 atendimentos finalizados por unidade ---------------
INSERT INTO atendimento (id_ubs, id_servico, codigo_senha, status, entrada, inicio_atendimento, fim_atendimento)
SELECT u.id_ubs, s.id_servico, 'A-' || lpad((t.g + 1)::text, 3, '0'), 'finalizado',
       t.fim - make_interval(mins => c.dur_min + 5),
       t.fim - make_interval(mins => c.dur_min),
       t.fim
FROM cenario c
JOIN ubs u     ON u.nome = c.nome
JOIN servico s ON s.nome = 'Atendimento geral'
CROSS JOIN LATERAL (
    SELECT g, now() - make_interval(mins => c.minutos_atras + g * 15) AS fim
    FROM generate_series(0, 9) g
) t;

-- 6) Fila atual: senhas aguardando ---------------------------------------
INSERT INTO atendimento (id_ubs, id_servico, codigo_senha, status, entrada)
SELECT u.id_ubs, s.id_servico, 'A-' || lpad((10 + n)::text, 3, '0'), 'aguardando',
       now() - make_interval(mins => c.minutos_atras)
FROM cenario c
JOIN ubs u     ON u.nome = c.nome
JOIN servico s ON s.nome = 'Atendimento geral'
CROSS JOIN generate_series(1, c.fila) AS n;

COMMIT;

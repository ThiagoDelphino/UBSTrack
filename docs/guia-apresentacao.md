# UBSTrack — guia para a apresentação

Resumo de como o sistema funciona, de onde vêm os números e o que mostrar na demonstração.

## 1. O que é (frase de abertura)

Painel que mostra ao cidadão de Sorocaba as unidades de pronto atendimento ordenadas pelo **tempo total estimado = deslocamento + espera na fila**. O sistema **numera, mas não recomenda**, e mostra em todas as telas o aviso: "Estimativas não garantem atendimento. Em emergência, ligue 192 (SAMU)."

## 2. Peças do sistema

| Peça | Porta | Papel |
| --- | --- | --- |
| `painel-web` | 5173 | Tela do cidadão (React): lista, filtros, detalhe, "Como funciona" |
| `painel-api` | 8000 | **Só lê** o banco, calcula as estimativas e devolve a lista já ordenada e numerada |
| `simulador-web` | 5174 | Tela do operador: retirar senha, chamar próximo, finalizar, desistir, modo automático |
| `simulador-api` | 8001 | **Única que escreve** no banco (faz o papel do hospital) |
| PostgreSQL | — | Tabelas `ubs`, `servico`, `ubs_servico`, `atendimento` (migrations com Alembic) |

As duas APIs não se chamam: **o banco é o ponto de encontro**. O simulador grava, o painel lê. O painel usa um usuário de banco só com SELECT.

## 3. Unidades

O seed `database/seeds/seed_upas_sorocaba.sql` carrega 5 unidades de atendimento 24 h (horário nulo = 24 h). Nomes, endereços e coordenadas são reais; **fila e tempos são simulados** (não existe dado público de fila).

| Unidade | Endereço |
| --- | --- |
| UPA Éden | R. Miguel José Gimenes, 75 — Jardim Portobello |
| UPH Zona Oeste | Av. Gen. Carneiro, 1670 — Vila Lucy |
| UPH Zona Norte | Av. Itavuvu, 19 — Vila Olímpia |
| UPH Zona Leste | R. Cel. Nogueira Padilha, 2585 — Vila Hortência |
| PA Parque das Laranjeiras | R. Sônia Bernuncio, 24 — Parque das Laranjeiras |

Se perguntarem "por que só 5?": é o recorte do MVP. A rede municipal tem mais PAs 24 h (por exemplo Brigadeiro Tobias, Aparecidinha, Carandá, São Bento, São Guilherme, Sorocaba 1, Habiteto e Ulisses Guimarães); entram no mesmo modelo só cadastrando a unidade no banco, sem mexer em código.

## 4. Como a fila e o tempo são calculados

Tudo está em `painel-api/app/domain/` (funções puras, com testes) e é montado em `services/painel_service.py`. Parâmetros em `core/config.py`.

1. **Fila** = quantidade de senhas com status `aguardando` na unidade.
2. **Tempo médio de atendimento** = média de (`fim_atendimento` − `inicio_atendimento`) dos **últimos 10** atendimentos `finalizado`. Sem histórico, usa **15 min**.
3. **Espera estimada** = fila × tempo médio (sempre exibida como "aprox.").
4. **Situação** (cor do selo): até 30 min = baixa; de 30 a 90 = moderada; acima de 90 = alta.
5. **Deslocamento** (só com localização): distância em linha reta (fórmula de Haversine) ÷ **25 km/h**.
6. **Tempo total** = deslocamento + espera. A lista é numerada 1º, 2º, 3º por esse valor.

Casos especiais:
- **Sem localização** (usuário negou o GPS): ordena só pela espera, com aviso.
- **Unidade fechada** (fora de `abre_as`/`fecha_as`): aparece sem número, no fim.
- **Dado desatualizado** (sem nenhum movimento há mais de 10 min): ganha aviso e vai para o fim, ainda numerada.
- Ordem final: abertas com dado recente → abertas desatualizadas → fechadas.

### Exemplo com números do seed (usuário no centro, lat -23.5015 / lon -47.4526)

| Pos. | Unidade | Distância | Deslocamento | Fila × média | Espera | Total |
| --- | --- | --- | --- | --- | --- | --- |
| 1º | UPH Zona Leste | 2,65 km | 6 min | 0 × 8 | 0 | **6 min** |
| 2º | PA Laranjeiras | 5,57 km | 13 min | 2 × 10 | 20 | **33 min** |
| 3º | UPH Zona Oeste | 3,21 km | 8 min | 3 × 10 | 30 | **38 min** |
| 4º | UPA Éden | 8,90 km | 21 min | 6 × 12 | 72 | **93 min** |
| 5º | UPH Zona Norte | 2,82 km | 7 min | 9 × 14 | 126 | **133 min** |

Boa história para a banca: a Zona Norte é a 2ª mais perto, mas fica em último por causa da fila; é exatamente o que o painel mostra.

## 5. Como cada pessoa entra na fila

Quem "entra" é uma **senha**, e quem cria é a `simulador-api` (`POST /unidades/{id}/senhas`, botão "Retirar senha" no simulador):

1. Confere que a unidade existe e tem serviço cadastrado ("Atendimento geral").
2. Trava a geração de código daquela unidade (`pg_advisory_xact_lock`), para duas pessoas simultâneas não pegarem o mesmo número.
3. Descobre o maior número do dia na unidade (fuso America/Sao_Paulo) e gera o próximo: **A-001, A-002…**, reiniciando todo dia.
4. Insere em `atendimento` com `status = aguardando` e `entrada = now()`. Pronto: o painel passa a contá-la na fila no próximo refresh (a cada 30 s).

Ciclo de vida (regras 1 e 12; o `WHERE` de cada `UPDATE` garante a transição, senão a API responde 409):

```
aguardando ──chamar próximo──▶ em_atendimento ──finalizar──▶ finalizado
    │                         (grava inicio_atendimento)     (grava fim_atendimento)
    └──desistir──▶ desistiu
```

"Chamar próximo" pega a senha aguardando mais antiga (FIFO) e usa `FOR UPDATE SKIP LOCKED`. Fila vazia devolve 404. Atendimentos finalizados alimentam a média do item 2 acima.

## 6. Modo automático (para a demo ficar viva)

**Para a demo, use o botão "Ligar" do Modo automático no `simulador-web`.** Ele roda **no navegador**: a cada rodada (ritmo "Rápido" = 2 s) sorteia uma ação por unidade (retirar, chamar, finalizar ou desistir) e chama a simulador-api. **Mantenha a aba do simulador aberta**; se ela fechar ou suspender, as filas param. A simulador-api também tem um modo automático próprio no servidor (`POST :8001/automatico/iniciar`); **não ligue os dois juntos**, senão o movimento dobra.

**Atenção:** o simulador comprime o tempo: os atendimentos duram de segundos a poucos minutos, não os 8–14 min do seed. Depois de um tempo, o "tempo médio" cai e as esperas estimadas diminuem. Diga isso em voz alta: "o simulador comprime o tempo só para a demonstração".

## 7. Roteiro sugerido da demo (5 min)

1. Abrir o painel (5173) com localização permitida e mostrar a lista numerada, selos de situação e o horário de atualização.
2. Abrir "Como funciona" e passar pelos 5 passos (é a mesma conta do item 4).
3. No simulador (5174), escolher a Zona Leste (fila 0), retirar 3 senhas e voltar ao painel: fila e espera sobem, o ranking pode mudar.
4. Chamar próximo / finalizar uma senha e mostrar a fila baixar.
5. Ligar o modo automático (botão no simulador, aba aberta) e deixar o painel atualizar sozinho.
6. Mostrar o aviso do 192 e a regra "informa, não recomenda".

## 8. Checklist antes de apresentar

- [ ] `docker compose down -v` e `docker compose up --build` (banco limpo, sem as "UBS Demo").
- [ ] Carregar **só** `seed_upas_sorocaba.sql` (o `seed_demo.sql` cria unidades fictícias "UBS Demo" que apareceriam na lista). No PowerShell **não use `Get-Content |`** (os acentos viram `?`): `docker compose cp database/seeds/seed_upas_sorocaba.sql db:/tmp/seed.sql` e depois `docker compose exec -e PGCLIENTENCODING=UTF8 db psql -U ubstrack -d ubstrack -f /tmp/seed.sql`.
- [ ] **Recarregar o seed ou ligar o modo automático (botão no simulador, aba aberta) poucos minutos antes**: o seed marca o último movimento há 1–4 min; passados 10 min sem movimento, todas as unidades viram "desatualizadas".
- [ ] Os dois frontends mostram "API conectada".
- [ ] Testar uma vez o fluxo completo na máquina que vai apresentar (permissão de localização no navegador incluída).
- [ ] Plano B: se o GPS falhar, a lista ordena só pela espera (regra 9).

## 9. Limitações para assumir com honestidade

- Fila, tempos e histórico são **simulados**; só nomes, endereços e coordenadas são reais.
- Distância em linha reta a 25 km/h é uma aproximação (não considera trânsito nem rotas).
- Sem login nem prioridade de atendimento (decisão de escopo; as tabelas de usuário já existem para o futuro).
- Estimativa não garante atendimento; em emergência, 192.

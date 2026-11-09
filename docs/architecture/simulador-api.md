# Como usar a simulador-api

A simulador-api faz o papel do hospital: é ela que cria e move as senhas na tabela `atendimento`. A painel-api só lê esses dados e calcula a fila.

- Endereço: http://localhost:8001
- Documentação interativa (testa as rotas pelo navegador): http://localhost:8001/docs

## 1. Preparar

```bash
cp .env.example .env          # só na primeira vez; troque as senhas
docker compose up --build
```

O banco começa vazio. Para ter unidades e filas de demonstração, carregue o seed (pode repetir quando quiser: ele recria as "UBS Demo" do zero):

```bash
# macOS, Linux e Git Bash
docker compose exec -T db psql -U ubstrack -d ubstrack < database/seeds/seed_demo.sql
```

```powershell
# PowerShell (Windows)
Get-Content database/seeds/seed_demo.sql | docker compose exec -T db psql -U ubstrack -d ubstrack
```

`ubstrack` é o `POSTGRES_USER` e o `POSTGRES_DB` do seu `.env`. Se você trocou, use os seus. No final deve aparecer `COMMIT`.

## 2. Rotas

| Rota | O que faz | Respostas |
| --- | --- | --- |
| `GET /unidades` | Lista as unidades (traz o `id` de cada uma) | 200 |
| `GET /unidades/{id_ubs}/fila` | Estado atual da fila: senhas aguardando e em atendimento | 200, 404 |
| `POST /unidades/{id_ubs}/senhas` | Retira uma senha (`aguardando`, código A-001, A-002... do dia) | 201, 404, 409 |
| `POST /unidades/{id_ubs}/chamar-proximo` | A senha aguardando mais antiga passa para `em_atendimento` | 200, 404 |
| `POST /atendimentos/{id}/finalizar` | `em_atendimento` → `finalizado` | 200, 404, 409 |
| `POST /atendimentos/{id}/desistir` | `aguardando` → `desistiu` | 200, 404, 409 |
| `GET /health` | Mostra se a API e o banco estão no ar | 200, 503 |

`{id_ubs}` é o `id` da unidade (de `GET /unidades`). `{id}` é o `id_atendimento` da senha (de `GET /unidades/{id_ubs}/fila` ou da resposta de retirar/chamar).

## 3. Passo a passo

Pelo navegador, abra http://localhost:8001/docs, clique na rota, depois em **Try it out**, preencha o id e clique em **Execute**. Pelo terminal, os mesmos passos:

> No PowerShell, use `curl.exe` em vez de `curl`.

**1. Descobrir o `id` da unidade**

```bash
curl http://localhost:8001/unidades
```

**2. Retirar uma senha**

```bash
curl -X POST http://localhost:8001/unidades/1/senhas
```
```json
{
  "id_atendimento": 458,
  "id_ubs": 1,
  "codigo_senha": "A-011",
  "status": "aguardando",
  "entrada": "2026-11-07T14:25:24.837099Z"
}
```

**3. Ver a fila**

```bash
curl http://localhost:8001/unidades/1/fila
```

Traz `aguardando`, `em_atendimento` e as listas `senhas_aguardando` e `senhas_em_atendimento` (da mais antiga para a mais nova), cada senha com seu `id_atendimento`.

**4. Chamar o próximo**

```bash
curl -X POST http://localhost:8001/unidades/1/chamar-proximo
```
```json
{
  "id_atendimento": 458,
  "id_ubs": 1,
  "id_servico": 1,
  "codigo_senha": "A-011",
  "status": "em_atendimento",
  "entrada": "2026-11-07T14:25:24.837099Z",
  "inicio_atendimento": "2026-11-07T14:25:24.866411Z",
  "fim_atendimento": null
}
```

**5. Finalizar o atendimento** (use o `id_atendimento` do passo 4)

```bash
curl -X POST http://localhost:8001/atendimentos/458/finalizar
```

Devolve a senha com `"status": "finalizado"` e o `fim_atendimento` preenchido.

**6. Ou desistir** (só para senha que ainda está aguardando)

```bash
curl -X POST http://localhost:8001/atendimentos/459/desistir
```

Devolve a senha com `"status": "desistiu"`.

## 4. Regras que a API aplica

```
aguardando ──► em_atendimento ──► finalizado
    └────────► desistiu
```

- Só se **finaliza** uma senha `em_atendimento`.
- Só se **desiste** de uma senha `aguardando`.
- Qualquer outra mudança é recusada com **409**, e a mensagem diz o status atual da senha.
- Cada mudança grava seu horário: `entrada`, `inicio_atendimento` e `fim_atendimento`. Como a tabela não tem coluna própria para a desistência, o horário dela fica em `fim_atendimento`. Isso não afeta o tempo médio de atendimento, que só considera senhas `finalizado`.
- **Chamar próximo** é seguro com cliques simultâneos: duas chamadas ao mesmo tempo nunca pegam a mesma senha.

## 5. Erros

| Código | Quando acontece | `detail` |
| --- | --- | --- |
| 404 | `chamar-proximo` numa unidade sem ninguém aguardando (ou que não existe) | `Nenhuma senha aguardando nesta unidade.` |
| 404 | `finalizar` ou `desistir` com id que não existe | `Senha não encontrada.` |
| 404 | `fila` ou `senhas` numa unidade que não existe | `Unidade não encontrada.` |
| 409 | Mudança de status que não é permitida (ex.: finalizar duas vezes) | `A senha está 'finalizado'; só é possível nesta ação se estiver 'em_atendimento'.` |
| 409 | Retirar senha numa unidade sem serviço cadastrado | `Unidade sem serviço cadastrado.` |
| 422 | Id que não é um número inteiro maior que zero | detalhes do campo |

## 6. Ver o efeito no painel

O painel lê o mesmo banco. Depois de mexer nas senhas, consulte http://localhost:8000/unidades: `fila`, `espera_min` e `atualizado_ha_min` mudam conforme as senhas são retiradas, chamadas e finalizadas.

## 7. Testes

```bash
docker compose exec simulador-api pytest
```

Esses testes não usam o banco, então rodar a suíte não altera seus dados.

## 8. Onde está cada parte

| Camada | Arquivo |
| --- | --- |
| Rotas de atendimento | `simulador-api/app/api/atendimento.py` |
| Formato da resposta | `simulador-api/app/schemas/atendimento.py` |
| Casos de uso | `simulador-api/app/services/atendimento_service.py` |
| SQL (chamar, finalizar, desistir) | `simulador-api/app/repositories/atendimento.py` |
| Rotas de unidades, fila e retirar senha | `simulador-api/app/api/unidades.py` |
## Modo automático (UPX090)

Simula movimento nas filas de **todas as unidades**, sem o operador clicar. Roda numa thread dentro da própria `simulador-api` e usa os mesmos casos de uso dos endpoints manuais.

| Método | Rota | O que faz |
|---|---|---|
| GET | `/automatico` | Estado: `ativo`, `intervalo_s`, `rodadas`, `erros`, `acoes` (totais) |
| POST | `/automatico/iniciar?intervalo_s=5` | Inicia (1 a 60 s entre rodadas). Se já ativo, não muda nada |
| POST | `/automatico/parar` | Para. Se já parado, não muda nada |

A cada rodada, por unidade (regras em `app/domain/automatico.py`): finaliza atendimentos que já duraram o suficiente, às vezes uma pessoa desiste, chama a próxima senha enquanto houver guichê livre (2 por unidade) e às vezes chega alguém (50%; para em 30 aguardando).

Pontos de atenção:
- Os atendimentos duram de 1 a 3 minutos (tempo comprimido para a demo). Como o painel calcula a média dos últimos 10 finalizados, o tempo médio mostrado tende a ~2 min enquanto o modo estiver ativo.
- O estado vive na memória do processo: reiniciar a API para o modo automático. Com mais de um worker, haveria uma simulação por worker; use um só (padrão do `docker-compose`).
- Erro numa unidade não derruba o modo: é contado em `erros` e registrado no log.

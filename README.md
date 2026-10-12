# UBSTrack

Painel que mostra ao cidadão de Sorocaba as unidades de saúde ordenadas pelo **tempo total estimado** (deslocamento + espera na fila). O sistema numera as unidades, mas não recomenda nenhuma. Em emergência, ligue **192 (SAMU)**.

Projeto acadêmico — Engenharia da Computação, Facens, 6º semestre (UPX).

## Estrutura

```
UBSTrack/
├── database/        estrutura do banco: models.py + migrations (Alembic)
├── painel-api/      FastAPI que lê o banco e calcula as filas      → http://localhost:8000
├── simulador-api/   FastAPI que grava as senhas (simula o hospital) → http://localhost:8001
├── painel-web/      React do cidadão                              → http://localhost:5173
├── simulador-web/   React do operador                             → http://localhost:5174
├── docs/            guia de arquitetura e padrões da equipe
└── docker-compose.yml
```

Arquitetura, regras de negócio, padrão de branches, commits e PRs: [`docs/architecture/README.md`](docs/architecture/README.md).

## Como rodar (Docker)

Pré-requisito: [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e aberto.

```bash
# 1. Criar o arquivo de variáveis (só na primeira vez) e trocar as senhas
cp .env.example .env

# 2. Subir tudo
docker compose up --build
```

Abra http://localhost:5173 (painel) e http://localhost:5174 (simulador). As duas telas devem mostrar "API conectada".

A documentação interativa das APIs fica em http://localhost:8000/docs e http://localhost:8001/docs.

### Comandos úteis

| Comando | O que faz |
| --- | --- |
| `docker compose up --build` | Sobe tudo (o `--build` reconstrói se um `requirements.txt` ou `package.json` mudou) |
| `docker compose up painel-api` | Sobe só a painel-api (e o que ela precisa: banco e migrations) |
| `docker compose down` | Para tudo, mantendo os dados do banco |
| `docker compose down -v` | Para tudo e **apaga o banco** (recomeça do zero) |
| `docker compose logs -f painel-api` | Acompanha os logs de um serviço |
| `docker compose exec painel-api pytest` | Roda os testes da painel-api |

## Adicionando uma biblioteca

**Python (uma das APIs ou `database/`):**

1. Instale com versão: `pip install nome-da-lib==1.2.3`
2. Adicione a mesma linha no `requirements.txt` **daquela pasta**.
3. Rode `docker compose up --build` para o container instalar também.
4. Commit do `requirements.txt` junto com o código que usa a lib.

**JavaScript (um dos `-web`):**

1. Dentro da pasta: `npm install nome-da-lib`
2. O npm atualiza sozinho o `package.json` e o `package-lock.json`. Os dois vão no commit.
3. Rode `docker compose up --build`.

Cada pasta tem as próprias dependências porque cada uma roda num container separado.

## Mudando o banco

1. Altere `database/models.py`.
2. Gere a migration: `docker compose run --rm migrate alembic revision --autogenerate -m "descricao"`
3. **Leia** o arquivo criado em `database/alembic/versions/`.
4. Aplique: `docker compose up migrate`
5. Commit do `models.py` e da migration juntos.

Nunca edite uma migration que já está na `develop`. Detalhes na seção 4 do guia.

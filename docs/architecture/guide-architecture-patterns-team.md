# UBSTrack — Guia de arquitetura e padrões da equipe

Oct 11, 2026 · @Gustavo Boing

## 1. Visão geral

O UBSTrack é um painel web que mostra ao cidadão de Sorocaba as unidades de saúde ordenadas pelo **tempo total estimado** (deslocamento + espera na fila). O sistema numera as unidades, mas **não recomenda** nenhuma e não substitui o atendimento de emergência: em caso grave, a orientação é ligar **192 (SAMU)**.

O projeto é formado por duas partes independentes que compartilham o mesmo banco PostgreSQL:

- **Painel** (`painel-web` + `painel-api`): o que o cidadão usa. Só **lê** o banco e faz os cálculos.
- **Simulador** (`simulador-web` + `simulador-api`): substitui os dados reais de um hospital. Um operador (ou o modo automático) retira senhas, chama e finaliza atendimentos. É o **único que escreve** na tabela de atendimentos.

Se um dia existir integração com dados reais, basta trocar quem escreve na tabela `ATENDIMENTO`. O painel não muda nada. Esse é o principal argumento da arquitetura.

&#91;embedded content: arquitetura geral · 4 aplicações, 1 banco\]

O painel só lê o banco; o simulador é o único que escreve em `ATENDIMENTO`. Uma integração real no futuro substitui apenas a coluna da direita.

### Fluxo principal

1. O operador clica em "retirar senha", "chamar próximo" ou "finalizar" (ou liga o modo automático). A API do simulador grava ou atualiza a linha em `ATENDIMENTO`, com o horário de cada etapa.
2. O painel web envia a localização do cidadão (se ele permitir) para a API do painel.
3. A API do painel lê `UBS` e `ATENDIMENTO`, aplica as regras de negócio (seção 6) e devolve a lista já ordenada e numerada.
4. O painel exibe a lista e repete a consulta a cada 30 segundos (*polling*).

### Escopo do MVP

| Entra no MVP (1 mês) | Fica para o futuro |
| --- | --- |
| Painel com unidades ordenadas e numeradas | Login de cidadão e de administrador (tabelas já existem no banco) |
| Fila, tempo estimado e situação de cada unidade | Fila separada por serviço (o banco já suporta) |
| Detalhe da unidade (endereço, horário, fila) | Notificações push (tabela `DISPOSITIVO` descontinuada) |
| Simulador: retirar senha, chamar, finalizar, desistir | Histórico e gráficos de movimento por horário |
| Simulador: modo automático para a demonstração | Integração com dados reais no lugar do simulador |
| Avisos fixos de estimativa e do 192 | Rota real considerando trânsito |

### Tecnologias e justificativa

| Tecnologia | Onde | Por que usamos |
| --- | --- | --- |
| Python + FastAPI | `painel-api`, `simulador-api` | Simples, valida dados automaticamente (Pydantic) e gera documentação da API em `/docs`, ótima para a apresentação |
| SQLAlchemy + Alembic | `database/` e repositórios | Já está configurado no repositório; o Alembic versiona a estrutura do banco como o Git versiona o código |
| PostgreSQL (local ou Supabase) | Banco compartilhado | Relacional, e o modelo já está pronto |
| React + TypeScript + Vite | `painel-web`, `simulador-web` | O TypeScript pega erros antes de rodar; o Vite cria e roda o projeto rápido |
| Docker Compose | Raiz do repositório | Sobe tudo igual em qualquer máquina e no dia da apresentação |
| Git + GitHub | Todo o projeto | Branches, pull requests, code review e versões (seções 7 a 11) |

**O que decidimos não usar, e por quê:** Redis, WebSockets, mensageria e Kubernetes resolvem problemas de escala que não temos. A atualização a cada 30 segundos atende o painel, e o *polling* é muito mais simples de implementar e explicar.

## 2. Organização do repositório

O repositório continua sendo **um só** (monorepo), mas a pasta `backend/` se divide em três partes: o banco (`database/`), a API do painel e a API do simulador. Os dois frontends ganham pastas próprias.

### Como está hoje

```
UBSTrack/
├── backend/
│   ├── alembic/            migrations
│   ├── app/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   └── models.py       tabelas (SQLAlchemy)
│   ├── Dockerfile
│   ├── alembic.ini
│   └── requirements.txt
├── .env.example
├── .gitignore
├── README.md
└── docker-compose.yml
```

### Como vai ficar

```
UBSTrack/
├── database/              DONO da estrutura do banco
│   ├── alembic/           migrations (vieram de backend/)
│   ├── alembic.ini
│   ├── models.py          única definição das tabelas
│   ├── seeds/             carga inicial: unidades, serviço "Atendimento geral", histórico
│   ├── Dockerfile         roda as migrations e sai
│   └── requirements.txt
├── painel-api/            FastAPI – leitura e cálculos (era backend/)
├── simulador-api/         FastAPI – escrita das senhas
├── painel-web/            React – cidadão
├── simulador-web/         React – operador
├── docs/
│   └── architecture/      este guia, diagramas, decisões
├── .github/
│   └── pull_request_template.md
├── .env.example
├── .gitignore
├── README.md
└── docker-compose.yml
```

**Por que tirar o Alembic e o `models.py` de dentro do backend?** Porque duas aplicações usam o mesmo banco. Se as migrations ficarem dentro de uma delas, essa aplicação vira "dona" do banco sem ser. Com `database/` separada, existe **um único lugar** que define as tabelas, e as duas APIs só consultam.

**E como as APIs acessam as tabelas sem o `models.py`?** Cada API escreve suas consultas nos **repositórios** (seção 3), usando SQL pelo SQLAlchemy. Assim não existem três cópias das mesmas classes para manter sincronizadas, e a equipe pratica SQL, que é cobrado no mercado.

### Passo a passo da reorganização

Faça tudo numa branch só (`chore/reorganizar-estrutura`), por **uma pessoa** (sugestão: o full stack), antes de o resto da equipe começar a programar. Assim ninguém tem conflito com arquivos que mudaram de lugar.

1. Criar a branch `develop` a partir da `main`, se ainda não existir (seção 7), e depois a branch `chore/reorganizar-estrutura` a partir da `develop`.
2. Mover o banco para `database/` usando `git mv` (o `git mv` preserva o histórico dos arquivos):
   - `git mv backend/alembic database/alembic`
   - `git mv backend/alembic.ini database/alembic.ini`
   - `git mv backend/app/models.py database/models.py`
3. Ajustar o `database/alembic/env.py` para importar o `models.py` do novo lugar e ler a URL do banco do `.env`.
4. Renomear o restante do backend: `git mv backend painel-api`.
5. Dentro de `painel-api/app/`, criar as pastas das camadas (seção 3) e mover `config.py` e `database.py` para `core/`.
6. Criar `simulador-api/` com a mesma estrutura de pastas (pode copiar o esqueleto do painel).
7. Criar os dois frontends com o Vite: `npm create vite@latest painel-web -- --template react-ts` e o mesmo para `simulador-web`.
8. Atualizar o `docker-compose.yml` com os serviços `db`, `migrate`, `painel-api`, `simulador-api`, `painel-web` e `simulador-web`.
9. Atualizar o `.env.example` com três conexões de banco: uma de **administrador** (só para migrations), uma **somente leitura** (painel) e uma de **escrita** (simulador).
10. Rodar `docker compose up` do zero e conferir se as migrations rodam e as duas APIs respondem em `/health`.
11. Abrir o PR para a `develop`, com o título `chore: reorganizar estrutura do monorepo`.

Depois desse PR aprovado, **todos** atualizam a `develop` local antes de criar novas branches.

## 3. Backend

As duas APIs são **monólitos organizados em camadas**: cada pasta tem uma única responsabilidade, e uma camada só conversa com a de baixo. É o padrão mais comum em vagas de backend e o mais fácil de explicar numa banca.

### Estrutura de pastas da `painel-api`

```
painel-api/
├── app/
│   ├── main.py              cria o FastAPI e registra as rotas
│   ├── core/
│   │   ├── config.py        parâmetros (velocidade, limites, etc.)
│   │   └── database.py      conexão com o banco
│   ├── api/
│   │   └── unidades.py      endpoints
│   ├── schemas/
│   │   └── unidade.py       formato das respostas (Pydantic)
│   ├── services/
│   │   └── painel_service.py   orquestra o caso de uso
│   ├── domain/
│   │   ├── estimativa.py    tempo médio, espera, situação
│   │   ├── geo.py           distância (Haversine) e deslocamento
│   │   ├── horario.py       aberta ou fechada
│   │   └── ordenacao.py     ordena e numera
│   └── repositories/
│       ├── unidade_repo.py
│       └── atendimento_repo.py
├── tests/                   testes do domain/ (pytest)
├── Dockerfile
└── requirements.txt
```

A `simulador-api` segue **a mesma estrutura**, com seus próprios arquivos em cada pasta (por exemplo, `domain/transicoes.py` com as regras de mudança de status).

### O que cada camada faz

| Camada | Responsabilidade | Não pode |
| --- | --- | --- |
| `api/` | Receber a requisição, validar parâmetros, devolver JSON | Ter regra de negócio ou SQL |
| `schemas/` | Definir o formato de entrada e saída de cada endpoint | Ter lógica |
| `services/` | Buscar dados nos repositórios, chamar as regras e montar a resposta | Escrever SQL |
| `domain/` | Regras de negócio puras (funções que recebem valores e devolvem valores) | Acessar banco ou HTTP |
| `repositories/` | Consultas SQL ao banco | Fazer cálculos de negócio |
| `core/` | Configuração e conexão | Ter regra de negócio |

**Por que o `domain/` é tão importante?** Como ele só tem funções puras, dá para testar com pytest sem banco e sem servidor. Na apresentação, vocês mostram que "fila de 8 com média de 12 minutos resulta em situação alta" está coberto por teste.

**Exemplo de caminho de uma requisição:** `GET /unidades` → `api/unidades.py` valida a latitude e a longitude → `services/painel_service.py` pede as unidades e os atendimentos aos repositórios → chama as funções do `domain/` → devolve a lista ao `api/`, que responde em JSON.

### Endpoints da `painel-api`

| Método e rota | O que faz |
| --- | --- |
| `GET /unidades?lat=&lon=` | Lista ordenada e numerada. Cada item traz: posição, nome, endereço, coordenadas, distância, deslocamento estimado, pessoas na fila, espera estimada, situação, aberta/fechada, "atualizado em" e se o dado está desatualizado. `lat` e `lon` são opcionais |
| `GET /unidades/{id}` | Detalhe de uma unidade |
| `GET /health` | Mostra se a API e o banco estão no ar |

### Endpoints da `simulador-api`

| Método e rota | O que faz |
| --- | --- |
| `GET /unidades` | Lista as unidades para o operador escolher |
| `GET /unidades/{id}/fila` | Estado atual da fila da unidade |
| `POST /unidades/{id}/senhas` | Retirar senha: cria uma senha `aguardando` com código sequencial do dia (A-001, A-002…) e horário de `entrada` |
| `POST /unidades/{id}/chamar-proximo` | A senha aguardando mais antiga passa para `em_atendimento` e recebe o `inicio_atendimento` |
| `POST /atendimentos/{id}/finalizar` | Só aceita senha `em_atendimento`; grava o `fim_atendimento` |
| `POST /atendimentos/{id}/desistir` | Só aceita senha `aguardando` |
| `GET /health` | Mostra se a API e o banco estão no ar |

**Cuidado com o "chamar próximo":** se dois cliques chegarem ao mesmo tempo, os dois podem pegar a mesma senha. A troca de status precisa acontecer numa única operação no banco (uma transação que trava a linha escolhida). Peçam esse cuidado no code review.

### Parâmetros configuráveis (`core/config.py`)

Nenhum desses números fica espalhado pelo código. Todos ficam no `config.py` e podem ser trocados pelo `.env`:

- velocidade média urbana para o deslocamento (sugestão: 25 km/h);
- quantidade de atendimentos usados na média (sugestão: últimos 10);
- tempo padrão quando não há histórico (sugestão: 15 min);
- limites das faixas de situação (sugestão: 30 e 90 min);
- tempo para considerar o dado desatualizado (sugestão: 10 min).

## 4. Banco de dados e migrations

O modelo do banco já está definido. O MVP usa de verdade só três tabelas: `UBS`, `SERVICO` e `ATENDIMENTO` (mais `UBS_SERVICO`, que liga as duas primeiras). As tabelas de login continuam no banco, prontas para o futuro.

### Ajustes no modelo

| Tabela | Ajuste | Motivo |
| --- | --- | --- |
| `DISPOSITIVO` | Remover | Notificações push ficaram fora do projeto |
| `ATENDIMENTO.id_user` | Passa a aceitar nulo | No MVP toda senha é anônima; se o login entrar, a coluna já existe |
| `ATENDIMENTO.chegada_prevista` | Remover | Só faria sentido com agendamento |
| `ATENDIMENTO.id_servico` | Continua obrigatório | Cada unidade terá o serviço padrão "Atendimento geral"; se a fila por serviço entrar depois, não precisa mudar o banco |
| `UBS.abre_as` e `fecha_as` | Aceitam nulo | Nulo nos dois significa unidade 24 horas |
| `USUARIO`, `FUNCIONARIO`, `AUTH_USERS` | Mantidas, sem uso no MVP | Preparadas para o login de cidadão e de administrador |

### Regras de acesso

- **Cada tabela tem um único dono que escreve.** Só o simulador grava em `ATENDIMENTO`. O painel só lê.
- O painel usa um **usuário de banco somente leitura** (uma *role* com permissão apenas de `SELECT`). Assim, "o painel não altera dados" é uma garantia técnica, não só uma promessa.
- As migrations rodam com um usuário administrador, separado dos dois anteriores.
- Nenhuma tabela guarda CPF, nome ou data de nascimento de quem retira senha. Por isso o MVP não lida com dado pessoal (LGPD).

### Como trabalhar com o Alembic

O Alembic funciona como um "Git do banco": cada mudança na estrutura vira um arquivo de migration, que todos aplicam na mesma ordem.

1. Alterar o `database/models.py`.
2. Gerar a migration com `alembic revision --autogenerate -m "descricao da mudanca"`.
3. **Abrir e ler o arquivo gerado.** O autogenerate erra às vezes (renomear coluna, por exemplo, ele entende como apagar e criar).
4. Aplicar com `alembic upgrade head` e testar.
5. Commitar o `models.py` e o arquivo da migration **juntos**, no mesmo PR.

Regras importantes:

- Nunca editar uma migration que já foi para a `develop`. Errou? Crie uma nova migration corrigindo.
- Só uma pessoa mexe em migration por vez. Combinem no grupo antes, porque duas migrations criadas em paralelo geram conflito de ordem.
- O script de carga inicial (`database/seeds/`) cria as unidades de Sorocaba, o serviço "Atendimento geral" e algumas horas de histórico, para o painel já começar a demonstração com médias reais.

## 5. Frontend

Os dois frontends usam React + TypeScript criados com Vite e seguem a mesma organização: **páginas** montam a tela, **componentes** desenham partes reutilizáveis, **hooks** guardam a lógica de estado e **services** são os únicos que falam com a API.

### Estrutura de pastas do `painel-web`

```
painel-web/
├── public/
├── src/
│   ├── main.tsx                 ponto de entrada
│   ├── App.tsx                  rotas
│   ├── pages/
│   │   ├── PainelPage.tsx       lista ordenada (tela principal)
│   │   ├── UnidadeDetalhePage.tsx
│   │   ├── SobrePage.tsx        como a estimativa é calculada
│   │   └── NaoEncontradaPage.tsx
│   ├── components/
│   │   ├── layout/              Cabecalho, Rodape, AvisoEmergencia (192)
│   │   ├── unidades/            ListaUnidades, CartaoUnidade, SeloSituacao, TempoEstimado
│   │   ├── mapa/                MapaUnidades (se o mapa entrar no MVP)
│   │   └── feedback/            Carregando, MensagemErro, EstadoVazio, AvisoDesatualizado
│   ├── hooks/
│   │   ├── useUnidades.ts       busca a lista e repete a cada 30 s
│   │   └── useLocalizacao.ts    pede o GPS e trata a recusa
│   ├── services/
│   │   ├── api.ts               endereço base e tratamento de erro
│   │   └── unidadesService.ts   funções que chamam a painel-api
│   ├── types/
│   │   └── unidade.ts           formato dos dados (igual aos schemas da API)
│   ├── utils/
│   │   └── formatadores.ts      "aprox. 25 min", "1,2 km"
│   └── styles/                  variáveis de cor e estilos globais
├── .env.example                 VITE_API_URL
├── Dockerfile
└── package.json
```

### Estrutura de pastas do `simulador-web`

```
simulador-web/src/
├── pages/
│   ├── OperacaoPage.tsx         escolher a unidade e operar a fila
│   ├── PainelChamadaPage.tsx    "TV da recepção": senha chamada em destaque
│   └── VisaoGeralPage.tsx       resumo de todas as unidades
├── components/
│   ├── SeletorUnidade.tsx
│   ├── ControlesFila.tsx        retirar, chamar, finalizar, desistir
│   ├── ListaSenhas.tsx
│   └── ModoAutomatico.tsx       liga/desliga e ritmo
├── hooks/                       useFila.ts, useModoAutomatico.ts
├── services/                    api.ts, simuladorService.ts
├── types/
└── utils/
```

A tela **Painel de chamada** imita a TV de uma recepção de hospital. Ela é barata de fazer e chama atenção na apresentação.

### Regras de organização

- **Componente não chama a API.** Quem chama é o `services/`, usado por um hook. O componente só recebe dados por *props* e desenha.
- **Página monta, componente desenha.** A página usa os hooks e distribui os dados entre os componentes.
- **Um componente por arquivo**, nome em PascalCase (`CartaoUnidade.tsx`). Hooks começam com `use`.
- **Os tipos em `types/` espelham os schemas da API.** Se o backend mudar um campo, o TypeScript aponta todos os lugares afetados.
- **O endereço da API vem do `.env`** (`VITE_API_URL`), nunca escrito direto no código.

### Estados que toda tela com dados precisa tratar

| Estado | O que mostrar |
| --- | --- |
| Carregando | Esqueleto ou indicador de carregamento |
| Erro | Mensagem clara e botão "tentar novamente" |
| Vazio | "Nenhuma unidade encontrada" |
| Sucesso | A lista ou o detalhe |
| Dado desatualizado | Aviso "sem dados recentes" na unidade, sem esconder a unidade |
| Sem localização | Lista ordenada só pela espera, com o aviso de que a distância não está sendo considerada |

### Bibliotecas

A regra é não instalar nada sem necessidade.

| Biblioteca | Usar? | Motivo |
| --- | --- | --- |
| `react-router-dom` | Sim | Há mais de uma página (lista, detalhe, sobre) |
| `fetch` nativo | Sim | Basta para poucas chamadas GET e POST; dispensa o Axios |
| CSS Modules | Sim | Já vem no Vite; estilo isolado por componente sem instalar nada |
| Leaflet + `react-leaflet` | Decisão em aberto | Mapa gratuito com OpenStreetMap, sem chave. Alternativa: só a lista, com link "abrir no Google Maps" |
| React Query, Redux, Axios | Não | Resolvem problemas que um projeto deste tamanho não tem |

## 6. Regras de negócio do MVP

Estas são as regras que o `domain/` implementa e que os testes verificam. Os números entre parênteses são sugestões e ficam no `config.py`.

| # | Regra | Como funciona |
| --- | --- | --- |
| 1 | Status da senha | `aguardando` → `em_atendimento` → `finalizado`, ou `aguardando` → `desistiu`. Cada mudança grava seu horário (`entrada`, `inicio_atendimento`, `fim_atendimento`) |
| 2 | Tamanho da fila | Quantidade de senhas `aguardando` na unidade |
| 3 | Tempo médio de atendimento | Média de (`fim_atendimento` − `inicio_atendimento`) dos últimos atendimentos finalizados (10). Sem histórico, usa o tempo padrão (15 min) |
| 4 | Espera estimada | Tamanho da fila × tempo médio. Sempre exibida como "aprox.", nunca como horário exato |
| 5 | Situação da fila | Baixa, moderada ou alta pela espera estimada (até 30 min, de 30 a 90 min, acima de 90 min). Vira a cor do selo |
| 6 | Ordenação numerada | Tempo total = deslocamento + espera. Deslocamento = distância em linha reta (Haversine) ÷ velocidade média (25 km/h). Unidades numeradas 1º, 2º, 3º, com o critério escrito na tela |
| 7 | Unidade fechada | Fora do horário `abre_as`/`fecha_as`, aparece como fechada e sai da ordenação |
| 8 | Dado desatualizado | Cada unidade mostra "atualizado há X min". Acima do limite (10 min), recebe o aviso e vai para o fim da lista |
| 9 | Sem localização | Se o cidadão negar o GPS, a lista é ordenada só pela espera, com aviso |
| 10 | Aviso fixo | Em todas as telas do painel: "Estimativas não garantem atendimento. Em emergência, ligue 192 (SAMU)." |
| 11 | Código da senha | Sequencial por unidade e por dia (A-001, A-002…), reiniciando a cada dia |
| 12 | Transições válidas | Só se finaliza uma senha em atendimento e só se marca desistência numa senha aguardando. Qualquer outra transição é recusada pela API |

**Por que o sistema numera, mas não recomenda?** Alguém muito mal pode ler "melhor opção" como garantia de atendimento rápido. A numeração com o critério explícito informa sem prometer, e o aviso do 192 direciona os casos graves para o lugar certo.

## 7. Branches

Usamos duas branches permanentes, `main` e `develop`, e branches temporárias com prefixo para cada tarefa. Ninguém faz commit direto na `main` nem na `develop`: tudo entra por pull request.

&#91;embedded content: fluxo de branches · tarefa → develop → main\]

O trabalho sai da `develop`, volta para ela com squash e só chega à `main` numa release com tag. O hotfix é a única exceção: sai da `main` e depois é levado de volta para a `develop`.

### Branches permanentes

| Branch | Para que serve | Quem atualiza |
| --- | --- | --- |
| `main` | Versão estável, que funciona e pode ser apresentada. Cada atualização recebe uma tag de versão | Só por PR vindo da `develop` (ou de um `hotfix/`) |
| `develop` | Integração do trabalho da equipe. É daqui que saem as branches de tarefa | Só por PR com review, com squash |

### Prefixos das branches temporárias

| Prefixo | Quando usar | Exemplo |
| --- | --- | --- |
| `feature/` | Funcionalidade nova | `feature/lista-unidades-ordenada` |
| `fix/` | Correção de bug encontrado na `develop` | `fix/espera-sem-historico` |
| `hotfix/` | Correção urgente de bug que já está na `main` (sai da `main`, não da `develop`) | `hotfix/aviso-samu-numero-errado` |
| `refactor/` | Melhora o código sem mudar o comportamento | `refactor/separar-calculo-deslocamento` |
| `docs/` | Só documentação | `docs/guia-de-arquitetura` |
| `test/` | Só testes | `test/regras-situacao-fila` |
| `chore/` | Configuração, dependências, Docker, estrutura | `chore/reorganizar-estrutura` |

### Regras de nome

- Tudo em minúsculas, palavras separadas por hífen, sem acento e sem espaço.
- O nome descreve a tarefa, não a pessoa: `feature/mapa-unidades`, e não `feature/thiago`.
- Se o card do Trello tiver número, coloque-o no começo: `feature/23-lista-unidades`. Assim dá para achar a tarefa pelo nome da branch.
- **Uma branch = uma tarefa.** Se a tarefa cresceu demais, quebre em duas.
- A branch vive pouco: o ideal é virar PR em até 2 ou 3 dias. Branch velha acumula conflito.

### Ciclo de vida de uma branch

1. Atualizar a `develop` local: `git checkout develop` e depois `git pull`.
2. Criar a branch a partir dela: `git checkout -b feature/lista-unidades-ordenada`.
3. Trabalhar e commitar aos poucos (seção 8).
4. Enviar para o GitHub: `git push -u origin feature/lista-unidades-ordenada`.
5. Abrir o PR para a `develop` (seção 9).
6. Depois do merge, apagar a branch no GitHub (botão "Delete branch") e na máquina: `git branch -D feature/lista-unidades-ordenada`.

### Proteção das branches no GitHub

O responsável pelo repositório configura em **Settings → Rules → Rulesets** (ou **Settings → Branches**):

- `main` e `develop`: exigir pull request antes do merge; bloquear push direto e *force push*; bloquear exclusão da branch.
- `develop`: exigir **1 aprovação**; descartar aprovações antigas quando chegam novos commits; exigir que todas as conversas do review estejam resolvidas.
- Métodos de merge: permitir só **squash** na `develop` e **merge commit** na `main` (seções 10 e 11). Se a opção por branch não aparecer na conta de vocês, permitam os dois métodos no repositório e o revisor confere o método antes de clicar.

## 8. Padrão de commits

Usamos o **Conventional Commits**, o padrão mais adotado no mercado. Cada mensagem diz o tipo da mudança, onde ela aconteceu e o que foi feito, numa linha curta.

### Formato

```
tipo(escopo): descrição curta no imperativo

corpo opcional explicando o porquê
```

- **tipo**: em inglês, da tabela abaixo.
- **escopo**: a parte do projeto afetada (lista abaixo). Opcional, mas recomendado.
- **descrição**: em português, no imperativo ("adicionar", "corrigir"), começando em minúscula, sem ponto final, com até 72 caracteres.
- **corpo**: opcional. Use quando o *porquê* não for óbvio.

### Tipos

| Tipo | Quando usar | Exemplo |
| --- | --- | --- |
| `feat` | Funcionalidade nova | `feat(painel-api): adicionar ordenação por tempo total` |
| `fix` | Correção de bug | `fix(painel-api): usar tempo padrão quando não há histórico` |
| `docs` | Documentação | `docs: adicionar guia de arquitetura` |
| `style` | Formatação, sem mudar lógica (espaços, ponto e vírgula) | `style(painel-web): aplicar prettier nos componentes` |
| `refactor` | Reorganizar código sem mudar comportamento | `refactor(simulador-api): extrair regras de transição para domain` |
| `test` | Criar ou ajustar testes | `test(painel-api): cobrir faixas de situação da fila` |
| `chore` | Configuração, dependências, tarefas de manutenção | `chore: atualizar docker-compose com simulador` |
| `build` | Docker, empacotamento, build | `build(painel-web): adicionar Dockerfile` |
| `ci` | Automação no GitHub Actions | `ci: rodar testes do backend nos PRs` |
| `perf` | Melhoria de desempenho | `perf(painel-api): agrupar consulta de filas` |

### Escopos do projeto

`painel-api`, `simulador-api`, `painel-web`, `simulador-web`, `database`, `docs`, `infra` (Docker e Compose).

### Boas práticas

- **Commits pequenos e frequentes.** Cada commit deve fazer uma coisa só. "Ajustes gerais" não diz nada.
- **Não commitar código quebrado** de propósito, nem arquivos gerados (`node_modules/`, `__pycache__/`, `.env`). O `.gitignore` já cuida da maior parte.
- **Nunca commitar senhas ou chaves.** Elas ficam no `.env`, que não vai para o GitHub. O `.env.example` mostra só os nomes das variáveis.
- Mudança que quebra quem usa a API (por exemplo, renomear um campo da resposta): adicione `!` depois do tipo (`feat(painel-api)!: renomear campo espera para espera_min`) e explique no corpo.

### Exemplos ruins e bons

| Ruim | Bom |
| --- | --- |
| `ajustes` | `fix(painel-web): mostrar erro quando a API não responde` |
| `Adicionei a tela nova.` | `feat(simulador-web): adicionar tela de painel de chamada` |
| `WIP` | `feat(painel-api): calcular distância com Haversine` |
| `banco` | `feat(database): permitir id_user nulo em atendimento` |

**Por que o padrão importa tanto aqui:** com o squash (seção 10), o **título do PR** vira o commit que fica na `develop`. Então o título do PR também segue este formato. Os commits dentro da branch podem ser mais livres, mas o hábito de escrevê-los bem é o que o mercado espera.

## 9. Pull requests e code review

Todo código entra na `develop` por pull request (PR) com **pelo menos 1 aprovação** de um colega da mesma área: backend revisa backend, frontend revisa frontend. Review não é fiscalização, é a forma de duas pessoas entenderem cada parte do sistema.

### Quem revisa quem

| Área do PR | Revisor | Se o revisor estiver indisponível |
| --- | --- | --- |
| `painel-api`, `simulador-api` | O outro integrante do backend | Full stack |
| `painel-web`, `simulador-web` | O outro integrante do frontend | Full stack |
| `database/`, Docker, CI | Full stack | Um integrante do backend |
| `docs/` | Qualquer integrante | — |
| PR que mexe em back e front ao mesmo tempo | Um revisor de cada área | — |

### Como abrir um bom PR

- **Título no padrão de commit** (seção 8), porque ele vira o commit na `develop`.
- **PR pequeno.** Até umas 300–400 linhas alteradas. PR gigante não é revisado de verdade, é aprovado no escuro.
- **Descrição preenchida** pelo modelo abaixo.
- **A branch atualizada com a `develop`** e sem conflitos antes de pedir review.
- O autor testa antes. O revisor não é o testador.

### Modelo de descrição (`.github/pull_request_template.md`)

Com esse arquivo no repositório, o GitHub preenche a descrição automaticamente em todo PR novo.

```markdown
## O que foi feito
## Card do Trello
## Tipo de mudança        (feat, fix, refactor, test, docs, chore)
## Área afetada           (painel-api, simulador-api, painel-web, simulador-web, database, docs/infra)
## Como testar
## Prints (se mudou tela)
## Observações para o revisor
## Checklist do autor     (título no padrão, branch atualizada, testado, teste no domain, models + migration juntos, sem segredos, docs)
## Checklist do revisor   (faz o que o card pede, camada certa, nomes claros, erros tratados, rodei localmente)
```

O arquivo completo, com as caixas de marcação, está em `.github/pull_request_template.md`.

### Checklist do revisor

- [ ] O código faz o que o card pede?
- [ ] Está na camada certa? (regra de negócio no `domain/`, SQL nos `repositories/`, chamada de API nos `services/` do front)
- [ ] Os nomes são claros?
- [ ] Os casos de erro foram tratados? (API fora do ar, lista vazia, sem histórico, GPS negado)
- [ ] Há teste para regra nova do `domain/`?
- [ ] Nada de senha, chave ou código comentado esquecido?
- [ ] Rodei a branch na minha máquina, quando o PR muda comportamento?

### Como comentar

- Comente o código, não a pessoa: "essa função pode quebrar com lista vazia", e não "você esqueceu".
- Diga o que é obrigatório e o que é sugestão. Use o prefixo `sugestão:` ou `nit:` (detalhe pequeno, não bloqueia) para o que é opcional.
- Explique o porquê e, se puder, proponha a alternativa.
- Elogie o que ficou bom. Também é parte do review.

### Os três resultados de um review

| Opção no GitHub | Quando usar |
| --- | --- |
| **Approve** | Pode entrar. Comentários `nit:` não impedem a aprovação |
| **Request changes** | Há algo obrigatório para corrigir antes do merge |
| **Comment** | Dúvidas ou sugestões, sem decidir ainda |

### Combinados de tempo

- Responder um pedido de review em até **24 horas**. Com um mês de projeto, PR parado é prazo perdido.
- O autor responde todos os comentários: corrige ou explica por que não corrigiu. Quem abriu a conversa é quem marca como resolvida.
- Quem clica no merge é o **autor**, depois da aprovação.

## 10. Merge na develop com squash

Todo PR para a `develop` entra com **Squash and merge**: todos os commits da branch viram **um único commit** na `develop`, com o título do PR como mensagem. O resultado é um histórico limpo, com uma linha por funcionalidade ou correção.

### Como fica o histórico

Na branch, o autor pode ter feito vários commits:

```
feat(painel-api): criar função de distância
fix: corrigir import
test: ajustar teste
fix: corrigir de novo o teste
```

Na `develop`, depois do squash, aparece só:

```
feat(painel-api): calcular distância e deslocamento até a unidade (#12)
```

O `(#12)` é o número do PR, que o GitHub adiciona sozinho. Clicando nele, qualquer pessoa encontra a discussão do review e todos os commits originais.

### Vantagens e cuidados

| Vantagens | Cuidados |
| --- | --- |
| Histórico da `develop` limpo e fácil de ler | O título do PR precisa estar no padrão, porque é ele que fica |
| Desfazer uma funcionalidade inteira é reverter um commit só | Depois do squash, **não continue trabalhando na mesma branch**: crie uma nova a partir da `develop` atualizada |
| Ninguém precisa se preocupar com commits "bagunçados" durante o trabalho | PR grande demais vira um commit grande demais; mantenha os PRs pequenos |

### Passo a passo do merge

1. O PR foi aprovado e todas as conversas estão resolvidas.
2. Se o GitHub avisar que a branch está desatualizada, clique em **Update branch** (ou, na máquina: `git checkout feature/...`, depois `git pull origin develop`, resolva conflitos, teste e faça `git push`).
3. Clique na seta do botão de merge e escolha **Squash and merge**.
4. Confira o título (padrão de commit) e limpe a descrição do commit, se quiser.
5. Confirme e clique em **Delete branch**.
6. Avise no grupo que entrou algo na `develop`. Quem está trabalhando faz `git pull origin develop` na própria branch para não acumular diferença.

### Resolvendo conflitos sem medo

Conflito acontece quando duas pessoas mudam a mesma parte de um arquivo. Não é erro de ninguém.

1. Traga a `develop` para a sua branch: `git pull origin develop`.
2. O Git marca os trechos em conflito com `<<<<<<<`, `=======` e `>>>>>>>`. Abra o arquivo no VS Code, que mostra botões para escolher "current", "incoming" ou "both".
3. Na dúvida, chame quem escreveu o outro trecho. Conflito se resolve conversando, não adivinhando.
4. Rode o projeto e os testes, faça o commit e o `git push`.

Na equipe, usamos **merge** da `develop` para dentro da branch (o `git pull` acima), e não *rebase*. O resultado final é o mesmo por causa do squash, e o merge é mais seguro para quem está aprendendo.

## 11. Release para a main e tags de versão

A `main` só recebe código quando a `develop` chega a um estado estável e demonstrável. Cada entrada na `main` é uma **versão**, marcada com uma tag no padrão de versionamento semântico (`v0.2.0`, `v1.0.0`).

### Versionamento semântico (SemVer)

O número tem três partes: `MAJOR.MINOR.PATCH`.

| Parte | Sobe quando | Exemplo |
| --- | --- | --- |
| `MAJOR` | Mudança que quebra quem usa o sistema, ou a primeira versão estável | `v0.9.0` → `v1.0.0` |
| `MINOR` | Funcionalidade nova que não quebra nada | `v0.2.0` → `v0.3.0` |
| `PATCH` | Só correção de bug | `v0.3.0` → `v0.3.1` |

Ao subir uma parte, as da direita voltam a zero (`v0.3.1` → `v0.4.0`).

**Versões `0.x.y` significam "em desenvolvimento".** O último commit do repositório usa "1.0.0" na mensagem, mas a versão `v1.0.0` deve ficar reservada para a entrega da apresentação. Sugestão: a primeira tag oficial ser `v0.1.0`.

### Plano de versões sugerido

| Versão | O que marca |
| --- | --- |
| `v0.1.0` | Estrutura reorganizada, banco e migrations rodando com Docker |
| `v0.2.0` | Simulador funcionando (API e tela de operação) |
| `v0.3.0` | API do painel com todas as regras de negócio e testes |
| `v0.4.0` | Painel web completo (lista, detalhe, estados de erro) |
| `v1.0.0` | Versão da apresentação: tudo integrado, revisado e documentado |

### Passo a passo de uma release

1. Combinar no grupo que a `develop` está pronta. Rodar tudo do zero com `docker compose up` e passar pelo fluxo principal.
2. Abrir um PR da `develop` para a `main` com o título `release: v0.2.0` e, na descrição, a lista do que entrou (os títulos dos PRs desde a última versão).
3. Pedir review de **uma pessoa do backend e uma do frontend**.
4. Fazer o merge com **Create a merge commit** (não squash, veja abaixo).
5. Criar a tag na `main` atualizada:
   - `git checkout main` e `git pull`
   - `git tag -a v0.2.0 -m "v0.2.0 - simulador funcionando"`
   - `git push origin v0.2.0`
6. No GitHub, em **Releases → Draft a new release**, escolher a tag e clicar em **Generate release notes**. O GitHub monta a lista de mudanças a partir dos PRs.

### Por que a main usa merge commit, e não squash?

Se a `develop` entrasse na `main` com squash, a `main` ganharia um commit que não existe na `develop`. Na release seguinte, o Git veria as duas branches como diferentes e geraria conflitos falsos. Com o merge commit, a `main` fica com exatamente os mesmos commits da `develop`, e as duas continuam alinhadas.

### Hotfix: bug urgente na main

1. Criar a branch a partir da `main`: `hotfix/descricao-curta`.
2. Corrigir, abrir PR para a `main` com review e fazer merge commit.
3. Criar a tag subindo o `PATCH` (`v0.2.0` → `v0.2.1`).
4. **Levar a correção para a `develop`** com um PR da `main` para a `develop`. Sem isso, o bug volta na próxima release.

## 12. Resumo rápido e glossário

### Meu dia a dia, em 8 passos

1. `git checkout develop` e `git pull`.
2. Criar a branch com prefixo: `git checkout -b feature/23-nome-da-tarefa`.
3. Programar na camada certa e commitar pequeno, no padrão `tipo(escopo): descrição`.
4. `git pull origin develop` antes de abrir o PR, para já resolver conflitos.
5. `git push -u origin feature/23-nome-da-tarefa` e abrir o PR para a `develop`, com o título no padrão e a descrição preenchida.
6. Pedir review ao colega da área e responder os comentários.
7. Aprovado: **Squash and merge** e **Delete branch**.
8. Mover o card no Trello e avisar o grupo.

### Decisões em aberto

- [ ] Mapa com Leaflet no MVP, ou só a lista com link "abrir no Google Maps"?
- [ ] Banco local no Docker ou Supabase na nuvem para a apresentação?
- [ ] Quem configura a proteção das branches e o modelo de PR no GitHub?

### Glossário

| Termo | Significado |
| --- | --- |
| Monorepo | Um único repositório com várias aplicações |
| Branch | Linha de trabalho separada; muda o código sem afetar as outras |
| Pull request (PR) | Pedido para juntar uma branch em outra, com espaço para review |
| Code review | Revisão do código por um colega antes de entrar |
| Squash | Juntar todos os commits de uma branch num só no momento do merge |
| Merge commit | Commit que junta duas branches mantendo o histórico das duas |
| Tag | Marcação fixa num commit, usada para nomear versões |
| Release | Versão publicada, com tag e notas das mudanças |
| SemVer | Versionamento semântico: `MAJOR.MINOR.PATCH` |
| Migration | Arquivo que descreve uma mudança na estrutura do banco |
| Camada | Pasta com uma única responsabilidade (api, services, domain, repositories) |
| Função pura | Recebe valores e devolve valores, sem acessar banco, rede ou tela |
| Polling | O frontend pergunta à API de tempos em tempos se algo mudou |
| Role somente leitura | Usuário do banco que só pode consultar, nunca alterar |
| Hotfix | Correção urgente feita direto a partir da `main` |

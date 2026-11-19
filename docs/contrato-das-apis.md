# Contrato das APIs — guia para o frontend

Este documento é para quem constrói `painel-web` e `simulador-web`. Todos os exemplos abaixo são respostas **reais** das APIs rodando sobre o `seed_demo.sql`. A documentação interativa (com botão "Try it out") fica em `/docs` de cada API.

| API | URL local | Quem usa | CORS permite |
| --- | --- | --- | --- |
| `painel-api` | http://localhost:8000 | `painel-web` (cidadão) | `http://localhost:5173`, só `GET` |
| `simulador-api` | http://localhost:8001 | `simulador-web` (operador) | `http://localhost:5174`, `GET` e `POST` |

Se o front rodar em outra porta, ajuste `CORS_ORIGINS` no `docker-compose.yml` (valores separados por vírgula). Sem isso o navegador bloqueia a chamada.

## Como subir com dados para testar

```bash
cp .env.example .env            # só na primeira vez
docker compose up --build
docker compose exec -T db psql -U ubstrack -d ubstrack < database/seeds/seed_demo.sql
```

No Windows (PowerShell): `Get-Content database/seeds/seed_demo.sql | docker compose exec -T db psql -U ubstrack -d ubstrack`.

Para as unidades reais de Sorocaba, carregue também `database/seeds/seed_upas_sorocaba.sql`.

Para a fila se mexer sozinha: `POST http://localhost:8001/automatico/iniciar`.

## Regras gerais (valem para as duas APIs)

- **Formato:** JSON. Datas em ISO 8601 **UTC** (terminam em `Z`). Converta para o horário local ao exibir.
- **Polling:** o painel deve repetir `GET /unidades` a cada **30 segundos**. Não há WebSocket.
- **Erros:** toda resposta de erro tem `detail` como **texto** que pode ser mostrado ao usuário. No 422 de validação vem também `erros`.

| Status | Quando | Corpo |
| --- | --- | --- |
| 404 | Unidade ou senha não existe; ou **fila vazia** ao chamar próximo | `{"detail": "Unidade não encontrada."}` |
| 409 | A senha não está no status certo para a ação | `{"detail": "A senha está 'finalizado'; só é possível nesta ação se estiver 'em_atendimento'."}` |
| 422 | Parâmetro inválido | `{"detail": "Parâmetros inválidos.", "erros": [{"campo": "lat", "mensagem": "..."}]}` |
| 503 | Banco fora do ar | `{"detail": "Banco de dados indisponível. Tente novamente em instantes."}` |
| 500 | Erro inesperado | `{"detail": "Erro interno. Tente novamente."}` |

> **Atenção:** "chamar próximo" com a fila vazia devolve **404** (não 409). Trate como "ninguém aguardando", não como falha.

> `GET /health` existe nas duas APIs. A resposta do painel usa a chave `database`; a do simulador usa `banco`. Ambas valem `"ok"` quando tudo está bem.

---

## painel-api (cidadão)

### `GET /unidades`

Lista as unidades **já ordenadas e numeradas**. Não reordene no front: use `posicao`.

| Parâmetro (query) | Obrigatório | Descrição |
| --- | --- | --- |
| `lat`, `lon` | Não, mas **sempre juntos** | Localização do cidadão. Com eles, vêm distância, deslocamento e tempo total, e a ordem passa a ser pelo tempo total |

Só `lat` ou só `lon` → 422 com `{"detail": "Envie lat e lon juntas, ou nenhuma das duas."}`.

Resposta com localização (`GET /unidades?lat=-23.5015&lon=-47.4526`):

```json
[
  {
    "posicao": 1,
    "id": 2,
    "nome": "UBS Demo Norte",
    "endereco": "Av. Exemplo, 200",
    "latitude": -23.47,
    "longitude": -47.44,
    "distancia_km": 3.73,
    "deslocamento_min": 9,
    "fila": 0,
    "espera_min": 0,
    "tempo_total_min": 9,
    "situacao": "baixa",
    "aberta": true,
    "atualizado_em": "2026-11-09T00:47:50.185668Z",
    "atualizado_ha_min": 3,
    "desatualizado": false
  }
]
```

Sem `lat`/`lon`, `distancia_km`, `deslocamento_min` e `tempo_total_min` vêm `null` e a lista é ordenada só pela espera.

| Campo | Tipo | Significado |
| --- | --- | --- |
| `posicao` | número ou `null` | Posição no ranking. **`null` para unidade fechada** (ela aparece na lista, sem número) |
| `id`, `nome`, `endereco` | | Identificação |
| `latitude`, `longitude` | número | Para marcar no mapa |
| `distancia_km` | número ou `null` | Em linha reta |
| `deslocamento_min` | inteiro ou `null` | Tempo estimado de ir até lá (25 km/h) |
| `fila` | inteiro | Pessoas aguardando |
| `espera_min` | inteiro | Espera estimada na fila |
| `tempo_total_min` | inteiro ou `null` | Deslocamento + espera |
| `situacao` | `"baixa"` \| `"moderada"` \| `"alta"` | Baixa até 30 min, moderada até 90, alta acima de 90 |
| `aberta` | boolean | Aberta agora |
| `atualizado_em` | data ou `null` | Último movimento na fila |
| `atualizado_ha_min` | inteiro ou `null` | Minutos desde o último movimento |
| `desatualizado` | boolean | `true` se passou de 10 min sem movimento. A unidade vai para o **fim** da lista: mostre um aviso visual |

### `GET /unidades/{id}`

Mesmo objeto, para a tela de detalhe. Aceita `lat` e `lon` do mesmo jeito. **`posicao` vem `null`** (o detalhe não tem ranking). Unidade inexistente → 404 `"Unidade não encontrada."`.

### Avisos obrigatórios na tela

Exiba sempre que houver estimativa: "Estimativas não garantem atendimento. Em emergência, ligue 192 (SAMU)."

---

## simulador-api (operador)

### `GET /unidades`

Lista simples para o operador escolher a unidade.

```json
[{"id": 4, "nome": "UBS Demo 24 Horas", "endereco": "Av. Teste, 400"}]
```

### `GET /unidades/{id}/fila`

Estado da fila da unidade, da senha mais antiga para a mais nova.

```json
{
  "id_ubs": 1,
  "nome": "UBS Demo Centro",
  "aguardando": 4,
  "em_atendimento": 0,
  "senhas_aguardando": [
    {
      "id_atendimento": 61,
      "codigo_senha": "A-011",
      "status": "aguardando",
      "entrada": "2026-11-09T00:48:52.150298Z",
      "inicio_atendimento": null
    }
  ],
  "senhas_em_atendimento": []
}
```

### `POST /unidades/{id}/senhas` → 201

Retira uma senha nova. Sem corpo. O código é sequencial por unidade e reinicia a cada dia.

```json
{
  "id_atendimento": 81,
  "id_ubs": 1,
  "codigo_senha": "A-015",
  "status": "aguardando",
  "entrada": "2026-11-09T00:50:52.435861Z"
}
```

Erros: 404 (unidade inexistente), 409 (`"Unidade sem serviço cadastrado."`).

### `POST /unidades/{id}/chamar-proximo` → 200

A senha aguardando mais antiga passa para `em_atendimento`. Sem corpo.

```json
{
  "id_atendimento": 61,
  "id_ubs": 1,
  "id_servico": 1,
  "codigo_senha": "A-011",
  "status": "em_atendimento",
  "entrada": "2026-11-09T00:48:52.150298Z",
  "inicio_atendimento": "2026-11-09T00:50:52.462025Z",
  "fim_atendimento": null
}
```

Erro: 404 `"Nenhuma senha aguardando nesta unidade."` quando a fila está vazia.

### `POST /atendimentos/{id_atendimento}/finalizar` → 200

Só aceita senha `em_atendimento`. Devolve o mesmo formato acima, com `status: "finalizado"` e `fim_atendimento` preenchido.

### `POST /atendimentos/{id_atendimento}/desistir` → 200

Só aceita senha `aguardando`. Devolve `status: "desistiu"`; o horário da desistência vem em `fim_atendimento`.

Para os dois: 404 `"Senha não encontrada."` e 409 se o status não permitir (o `detail` já explica e pode ser exibido).

### Ciclo de vida da senha

```
aguardando ──chamar-proximo──► em_atendimento ──finalizar──► finalizado
    └──────────desistir──────► desistiu
```

Qualquer outra mudança é recusada com 409. Cliques duplos são seguros: a segunda requisição recebe 409, sem efeitos colaterais. Sugestão de tela: desabilite o botão enquanto a requisição estiver em andamento e, ao receber 409, apenas recarregue a fila.

### Modo automático

Movimenta as filas de **todas** as unidades sozinho (chegadas, chamadas, finalizações e desistências), para demonstração.

| Método e rota | O que faz |
| --- | --- |
| `GET /automatico` | Estado atual |
| `POST /automatico/iniciar?intervalo_s=5` | Liga (de 1 a 60 s entre rodadas). Se já ligado, não muda nada |
| `POST /automatico/parar` | Desliga. Se já desligado, não muda nada |

```json
{
  "ativo": false,
  "intervalo_s": null,
  "rodadas": 0,
  "erros": 0,
  "iniciado_em": null,
  "ultima_rodada_em": null,
  "acoes": {"retirada": 0, "chamada": 0, "finalizacao": 0, "desistencia": 0}
}
```

Sugestão: um botão "Modo automático" no simulador que liga/desliga conforme `ativo`, consultando `GET /automatico` ao abrir a tela.

Durante o modo automático os atendimentos simulados duram de 1 a 3 minutos; por isso o `espera_min` do painel tende a valores baixos.

---

## Tipos TypeScript sugeridos

```ts
export type Situacao = "baixa" | "moderada" | "alta";

export interface UnidadePainel {
  posicao: number | null;
  id: number;
  nome: string;
  endereco: string | null;
  latitude: number;
  longitude: number;
  distancia_km: number | null;
  deslocamento_min: number | null;
  fila: number;
  espera_min: number;
  tempo_total_min: number | null;
  situacao: Situacao;
  aberta: boolean;
  atualizado_em: string | null;
  atualizado_ha_min: number | null;
  desatualizado: boolean;
}

export type StatusSenha = "aguardando" | "em_atendimento" | "finalizado" | "desistiu";

export interface SenhaNaFila {
  id_atendimento: number;
  codigo_senha: string;
  status: StatusSenha;
  entrada: string;
  inicio_atendimento: string | null;
}

export interface FilaResponse {
  id_ubs: number;
  nome: string;
  aguardando: number;
  em_atendimento: number;
  senhas_aguardando: SenhaNaFila[];
  senhas_em_atendimento: SenhaNaFila[];
}

export interface AutomaticoEstado {
  ativo: boolean;
  intervalo_s: number | null;
  rodadas: number;
  erros: number;
  iniciado_em: string | null;
  ultima_rodada_em: string | null;
  acoes: Record<"retirada" | "chamada" | "finalizacao" | "desistencia", number>;
}

export interface ErroApi {
  detail: string;
  erros?: { campo: string; mensagem: string }[];
}
```

## Pegadinhas conhecidas

1. **Dados "desatualizados":** com o seed, a fila é de "agora"; depois de 10 min sem movimento as unidades aparecem como `desatualizado: true`. Rode o seed de novo ou ligue o modo automático.
2. **Unidade fechada** vem na lista com `posicao: null`. Não calcule posição no front.
3. **Sem GPS:** se o usuário negar a localização, chame `GET /unidades` sem parâmetros e mostre a mensagem de que a ordem considera só a espera.
4. **Horário:** converta os campos `*_em`, `entrada`, `inicio_atendimento` e `fim_atendimento` de UTC para o fuso local.

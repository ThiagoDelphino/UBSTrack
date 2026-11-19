# simulador-web

UBSTrack — **Simulador do operador**. React + TypeScript + Vite.

Faz o papel da recepção de um hospital: retira senhas, chama, finaliza e marca desistências na `simulador-api`. O painel do cidadão enxerga esse movimento pelo mesmo banco.

## Telas

| Rota | Página | O que faz |
| --- | --- | --- |
| `/` | `OperacaoPage` | Escolhe a unidade e opera a fila: retirar senha, chamar próximo, finalizar e desistir. Tem o **modo automático** e o histórico de ações |
| `/visao-geral` | `VisaoGeralPage` | Resumo de todas as unidades (aguardando e em atendimento), com atalhos |
| `/painel-chamada` | `PainelChamadaPage` | "TV da recepção": senha chamada em destaque, em tela cheia. Aceita `?ubs=ID` |

A unidade escolhida vai na URL (`/?ubs=2`) e fica lembrada na sessão. Erros da API (404 e 409) aparecem com a mensagem que a própria API devolve.

### Modo automático

Liga em qualquer tela (cartão no menu lateral ou na tela de operação). A cada rodada, para **cada unidade**, ele olha a fila e faz uma ação (retirar, chamar, finalizar ou desistir), usando as mesmas rotas do operador. O ritmo é de 2, 5 ou 10 s. Como roda no navegador, **a aba precisa ficar aberta**. A regra de sorteio está em `src/utils/modoAutomatico.ts`.

## Rodar sem Docker

```bash
cp .env.example .env
npm install
npm run dev
```

Abre em http://localhost:5174. Precisa da simulador-api rodando em http://localhost:8001.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento, recarrega ao salvar |
| `npm run build` | Checa os tipos e gera a versão de produção em `dist/` |
| `npm run lint` | Procura problemas no código |

## Identidade visual

Mesma do `painel-web`: `src/styles/global.css`, `components/ui/Icone.tsx`, `components/layout/Logo.tsx` e `components/layout/Layout.tsx` são **cópias idênticas** (cada app roda num container separado). Se mudar uma cor ou um ícone aqui, repita no `painel-web`. O que diferencia o simulador é a etiqueta "Simulação" e o menu de operador.

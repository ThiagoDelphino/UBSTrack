# painel-web

UBSTrack — **Painel do cidadão**. React + TypeScript + Vite.

Mostra as unidades de saúde de Sorocaba ordenadas pelo **tempo total estimado** (deslocamento + espera na fila). O painel numera as unidades, mas **não recomenda** nenhuma. O aviso "Estimativas não garantem atendimento. Em emergência, ligue 192 (SAMU)" aparece em todas as telas (regra 10).

## Telas

| Rota | Página | O que mostra |
| --- | --- | --- |
| `/` | `PainelPage` | Resumo da rede, busca, filtro por situação e a lista numerada de unidades. Atualiza sozinha a cada 30 s |
| `/unidades/:id` | `UnidadeDetalhePage` | Números da unidade, como o tempo total foi composto e atalho para a rota no Google Maps |
| `/sobre` | `SobrePage` | Como a estimativa é calculada, faixas de situação e casos especiais |
| `*` | `NaoEncontradaPage` | Página inexistente |

Estados tratados em toda tela com dados: carregando (esqueleto), erro com "tentar novamente", vazio, sucesso, unidade com dado desatualizado e **sem localização** (a lista segue ordenada só pela espera, com aviso).

## Rodar sem Docker

```bash
cp .env.example .env
npm install
npm run dev
```

Abre em http://localhost:5173. Precisa da painel-api rodando em http://localhost:8000 e, para ter dados, do seed (`database/seeds/`).

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento, recarrega ao salvar |
| `npm run build` | Checa os tipos e gera a versão de produção em `dist/` |
| `npm run lint` | Procura problemas no código |

## Identidade visual

O painel e o simulador compartilham a mesma identidade: `src/styles/global.css` (cores, fontes, botões), `components/ui/Icone.tsx`, `components/layout/Logo.tsx` e `components/layout/Layout.tsx` são **iguais** nos dois apps, porque cada app roda num container separado. Se mudar uma cor ou um ícone aqui, repita no `simulador-web`.

A organização das pastas está em `docs/architecture/guide-architecture-patterns-team.md`, seção 5.

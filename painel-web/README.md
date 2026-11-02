# painel-web

UBSTrack — Painel. React + TypeScript + Vite.

## Rodar sem Docker

```bash
cp .env.example .env
npm install
npm run dev
```

Abre em http://localhost:5173. Precisa da painel-api rodando em http://localhost:8000.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento, recarrega ao salvar |
| `npm run build` | Checa os tipos e gera a versão de produção em `dist/` |
| `npm run lint` | Procura problemas no código |

A organização das pastas está em `docs/architecture/README.md`, seção 5.

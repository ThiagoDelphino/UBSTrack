/// <reference types="vite/client" />

// Tipos das variáveis de ambiente: o TypeScript avisa se alguém
// escrever import.meta.env.VITE_API_UR (com erro de digitação).
interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

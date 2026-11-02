import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // aceita conexões de fora do container (Docker)
    port: 5174,
    strictPort: true, // se a porta estiver ocupada, dá erro em vez de trocar sozinho
    watch: {
      // No Docker com Windows, o Vite não percebe arquivos salvos sem isso.
      usePolling: true,
    },
  },
})

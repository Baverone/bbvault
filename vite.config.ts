import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 5180 e a porta do bbvault; strictPort para nunca cair numa porta de outro servico.
  server: { port: 5180, strictPort: true },
})

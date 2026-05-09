import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173
  },
  build: {
    drop: ['console', 'debugger']
  },
  worker: {
    format: 'es'
  }
})

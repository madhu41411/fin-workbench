import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/app/mje-ui/',
  server: {
    proxy: {
      '/odata': {
        target: 'http://localhost:4004',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})

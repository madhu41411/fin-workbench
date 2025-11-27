import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    base: '/app/ppc-ui/',
    plugins: [react()],
    server: {
        proxy: {
            '/odata': {
                target: 'http://localhost:4004',
                changeOrigin: true,
            }
        }
    }
})

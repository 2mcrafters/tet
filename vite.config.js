import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // URL de ton backend Laravel
        changeOrigin: true,
        secure: false,
        rewrite: path => path.replace(/^\/api/, '/api'), // Optionnel ici mais clair
      },
    },
  },
})

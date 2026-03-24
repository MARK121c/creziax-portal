import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://api.creziax.cloud',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-ui': ['lucide-react', 'react-hot-toast'],
          'vendor-utils': ['axios', 'date-fns', 'zustand', 'i18next'],
          'vendor-viz': ['recharts', 'xlsx']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})

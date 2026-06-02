import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor: core React runtime
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Charts (recharts is large — isolate it)
          'charts': ['recharts'],
          // QR scanner (also large)
          'qr': ['html5-qrcode'],
          // Remaining UI libs
          'ui': ['framer-motion', 'react-hot-toast', 'lucide-react'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})

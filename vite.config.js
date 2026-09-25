import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { mockApiPlugin } from './mock/api.mjs'

export default defineConfig(({ mode, command }) => ({
  plugins: [react(), tailwindcss(), ...(command === 'serve' ? [mockApiPlugin('/__dummy/api/v1')] : []), ...(loadEnv(mode, process.cwd()).VITE_API_MODE === 'mock' ? [mockApiPlugin()] : [])],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  base: '/',
  server: { port: Number(process.env.PORT) || 5180 },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['motion'],
        },
      },
    },
  },
}))

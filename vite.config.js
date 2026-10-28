import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { auditDevPlugin } from './scripts/audit-dev-plugin.mjs'
import { reviewAssetsPlugin } from './scripts/review-assets-plugin.mjs'

export default defineConfig(async ({ mode, command }) => {
  const mock = command==='serve' && loadEnv(mode, process.cwd()).VITE_API_MODE === 'mock'
  const mockPlugins = mock ? await import('./mock/api.mjs').then(({mockApiPlugin})=>[mockApiPlugin('/__dummy/api/v1'),mockApiPlugin()]) : []
  return ({
  plugins: [react(), tailwindcss(), reviewAssetsPlugin(command === 'build' && loadEnv(mode, process.cwd()).VITE_ENABLE_API_REVIEW === 'true'), ...(command === 'serve' ? [auditDevPlugin()] : []), ...mockPlugins],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  base: '/',
  server: { port: Number(process.env.PORT) || 5180, watch: { ignored: ['**/docs/api-audit/**','**/.mock-data/**'] } },
  preview: process.env.KIDSVERSE_REVIEW_PROXY_BASE ? {proxy:{'/api/v1':{
    target:new URL(process.env.KIDSVERSE_REVIEW_PROXY_BASE).origin,
    changeOrigin:true,
    rewrite:path=>new URL(process.env.KIDSVERSE_REVIEW_PROXY_BASE).pathname.replace(/\/$/,'')+path,
  }}} : {},
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
})
})

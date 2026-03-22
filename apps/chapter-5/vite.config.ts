import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3005,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  build: {
    target: 'es2015',
    lib: false,
    rollupOptions: {
      output: {
        format: 'umd',
        entryFileNames: 'index.js',
      },
    },
  },
  base: '/apps/chapter-5/',
})

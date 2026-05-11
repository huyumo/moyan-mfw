import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue(), vueJsx()],
  server: {
    port: 5200,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src/frontend',
      'moyan-mfw-base-frontend': resolve(import.meta.dirname, '../../base-frontend/src'),
    },
  },

})

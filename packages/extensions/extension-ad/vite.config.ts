import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5200,
    open: false,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})

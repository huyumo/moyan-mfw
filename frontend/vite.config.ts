/**
 * @fileoverview 前端应用 Vite 配置。
 */

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

// base-frontend 源码路径
const baseFrontendSrc = resolve(__dirname, '../packages/base-frontend/src');

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // frontend 自身别名
      '@': resolve(__dirname, 'src'),
      // base-frontend 包入口
      'moyan-mfw-base-frontend': baseFrontendSrc,
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/v1': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/docs': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/docs-json': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router'],
          'vendor-element-icons': ['@element-plus/icons-vue'],
        },
      },
    },
  },
});

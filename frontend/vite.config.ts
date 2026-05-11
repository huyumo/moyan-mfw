/**
 * @fileoverview 前端应用 Vite 配置。
 */

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import vueJsxPlugin from '@vitejs/plugin-vue-jsx';

// base frontend source path
const baseFrontendSrc = resolve(__dirname, '../packages/base/src/frontend');

export default defineConfig({
  plugins: [vue(), vueJsxPlugin()],
  resolve: {
    alias: {
      // frontend self alias
      '@': resolve(__dirname, 'src'),
      // base package frontend entry
      'moyan-mfw-base/frontend': baseFrontendSrc,
      'moyan-mfw-base/shared': resolve(__dirname, '../packages/base/src/shared/index.ts'),
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

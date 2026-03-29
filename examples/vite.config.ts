/**
 * @fileoverview 前端应用 Vite 配置。
 */

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'moyan-mfw-base-frontend': resolve(__dirname, '../packages/base-frontend/src'),
    },
  },
  server: {
    port: 5174,
    host: true,
    proxy: {
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

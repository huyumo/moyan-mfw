/**
 * @fileoverview 前端应用 Vite 配置。
 */

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import vueJsxPlugin from '@vitejs/plugin-vue-jsx';

export default defineConfig({
  plugins: [vue(), vueJsxPlugin()],
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'moyan-mfw-base/frontend': resolve(__dirname, '../packages/base/src/frontend'),
      'moyan-mfw-extension-ad/frontend': resolve(__dirname, '../packages/extensions/extension-ad/src/frontend'),
      'moyan-mfw-base/shared': resolve(__dirname, '../packages/base/src/shared/index.ts'),
      'moyan-mfw-extension-ad/shared': resolve(__dirname, '../packages/extensions/extension-ad/src/shared/index.ts'),
      '@internal/base-shared': resolve(__dirname, '../packages/base/dist/shared/index.js'),
      '@internal/ad-shared': resolve(__dirname, '../packages/extensions/extension-ad/dist/shared/index.js'),
    },
  },
  server: {
    port: 5173,
    host: true,
    fs: {
      strict: false,
    },
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/v1': { target: 'http://localhost:3000', changeOrigin: true },
      '/docs': { target: 'http://localhost:3000', changeOrigin: true },
      '/docs-json': { target: 'http://localhost:3000', changeOrigin: true },
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
  optimizeDeps: {
    include: ['vue-router', 'element-plus', '@element-plus/icons-vue'],
  },
});

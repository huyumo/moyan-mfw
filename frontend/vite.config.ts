/**
 * @fileoverview 前端应用 Vite 配置。
 */

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import vueJsxPlugin from '@vitejs/plugin-vue-jsx';

// base frontend source path
const baseFrontendSrc = resolve(__dirname, '../packages/base/src/frontend');
// extension-ad frontend source path
const adFrontendSrc = resolve(__dirname, '../packages/extensions/extension-ad/src/frontend');

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
      // Vue SFC 入口 → 源码（Vite 原生处理 .vue）
      'moyan-mfw-base/frontend': baseFrontendSrc,
      'moyan-mfw-extension-ad/frontend': adFrontendSrc,
      '@internal/base-frontend': baseFrontendSrc,
      // shared 模块 → 源码（已安装 reflect-metadata）
      'moyan-mfw-base/shared': resolve(__dirname, '../packages/base/src/shared/index.ts'),
      'moyan-mfw-extension-ad/shared': resolve(__dirname, '../packages/extensions/extension-ad/src/shared/index.ts'),
      '@internal/base-shared': resolve(__dirname, '../packages/base/src/shared/index.ts'),
      '@internal/ad-shared': resolve(__dirname, '../packages/extensions/extension-ad/src/shared/index.ts'),
    },
  },
  server: {
    port: 5173,
    host: true,
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
    include: [
      'vue-router', 'element-plus', '@element-plus/icons-vue',
      '@internal/base-shared',
      '@internal/ad-shared',
      'reflect-metadata',
    ],
  },
});

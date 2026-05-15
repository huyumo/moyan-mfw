/**
 * @fileoverview Extension-AD frontend dev/build configuration.
 */

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [vue(), vueJsx()],
  server: {
    port: 5200,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/frontend', import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/frontend/index.ts', import.meta.url)),
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.js'),
    },
    rollupOptions: {
      external: [
        'vue',
        'vue-router',
        'pinia',
        'axios',
        'element-plus',
        '@element-plus/icons-vue',
        /^moyan-api(\/.*)?$/,
        '@internal/base-shared',
        '@internal/base-frontend',
        '@internal/ad-shared',
      ],
    },
    outDir: '../../dist/frontend',
    sourcemap: true,
  },
});

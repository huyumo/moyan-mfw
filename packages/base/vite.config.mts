/**
 * @fileoverview Base package frontend build configuration.
 */

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/frontend', import.meta.url)),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.vue'],
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/frontend/index.ts'),
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
        'reflect-metadata',
        /^moyan-api(\/.*)?$/,
        '@internal/base-shared',
      ],
    },
    outDir: '../../dist/frontend',
    sourcemap: true,
  },
});

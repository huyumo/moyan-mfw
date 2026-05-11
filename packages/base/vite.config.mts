/**
 * @fileoverview Base package frontend build configuration.
 */

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src/frontend'),
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
      ],
    },
    outDir: 'dist/frontend',
    sourcemap: true,
  },
});

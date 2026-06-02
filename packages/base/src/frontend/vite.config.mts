import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'vite-helpers': resolve(__dirname, 'src/vite-helpers.ts'),
      },
      formats: ['es', 'cjs'],
      fileName(format, entryName) {
        if (entryName === 'index') {
          return format === 'es' ? 'index.mjs' : 'index.js';
        }
        return format === 'es' ? 'vite-helpers.mjs' : 'vite-helpers.js';
      },
    },
    rollupOptions: {
      external: ['vue', 'vue-router', 'element-plus', '@element-plus/icons-vue', 'pinia', '@vueuse/core', 'axios', 'moyan-api', 'md-editor-v3', 'quill', 'vue-advanced-cropper', 'moyan-mfw-base/shared'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
          'vue-router': 'VueRouter',
          'element-plus': 'ElementPlus',
          pinia: 'Pinia',
        },
      },
    },
  },
});

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
  build: {
    outDir: '../../dist/frontend',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'index.mjs' : 'index.js',
    },
    rollupOptions: {
      external: ['vue', 'vue-router', 'element-plus', '@element-plus/icons-vue', 'pinia', '@vueuse/core', 'axios', 'md-editor-v3', 'quill', 'vue-advanced-cropper', 'moyan-mfw-base/shared'],
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

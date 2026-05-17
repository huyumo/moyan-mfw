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
      'moyan-mfw-base/frontend/styles': resolve(__dirname, '../../../../base/src/frontend/src/styles'),
      'moyan-mfw-base/frontend': resolve(__dirname, '../../../../base/src/frontend/src/index.ts'),
      'moyan-mfw-base/shared': resolve(__dirname, '../../../../base/src/shared/src/index.ts'),
      'moyan-extension-test-ext/shared': resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  build: {
    outDir: '../../dist/frontend',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['vue', 'vue-router', 'element-plus', '@element-plus/icons-vue', 'moyan-mfw-base/frontend', 'moyan-mfw-base/shared'],
      output: { exports: 'named' },
    },
  },
});

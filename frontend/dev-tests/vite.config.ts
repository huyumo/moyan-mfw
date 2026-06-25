import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      'moyan-mfw-base/frontend': resolve(__dirname, '../../packages/base/src/frontend/src'),
      'moyan-mfw-base/shared': resolve(__dirname, '../../packages/base/src/shared/src/index.ts'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  server: {
    port: 5174,
  },
});

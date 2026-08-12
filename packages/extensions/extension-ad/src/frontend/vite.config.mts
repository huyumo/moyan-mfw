import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { resolve } from 'path';
import { fixVueDefaultImport } from 'moyan-mfw-base/frontend/vite-helpers';

export default defineConfig({
  root: '.',
  plugins: [vue(), vueJsx(), fixVueDefaultImport()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'moyan-mfw-base/frontend/styles': resolve(__dirname, '../../../../base/src/frontend/src/styles'),
      'moyan-mfw-base/frontend': resolve(__dirname, '../../../../base/src/frontend/src/index.ts'),
      'moyan-mfw-base/frontend/vite-helpers': resolve(__dirname, '../../../../base/src/frontend/src/vite-helpers.ts'),
      'moyan-mfw-base/shared': resolve(__dirname, '../../../../base/src/shared/src/index.ts'),
      'moyan-mfw-extension-ad/shared': resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        silenceDeprecations: ['legacy-js-api'],
      },
    },
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
    rollupOptions: {
      // moyan-api 必须外部化：否则 ApiCall 类会被内联进产物，导致运行时存在两个 ApiCall 实例，
      // 而 MoAxios.install() 只把请求处理器（MoCall）注册到 moyan-api 包的 ApiCall 上，
      // 扩展内联的 ApiCall.MoCall 永远为 undefined，API 调用会抛错。
      external: ['vue', 'vue-router', 'element-plus', '@element-plus/icons-vue', 'moyan-api', 'moyan-mfw-base/frontend', 'moyan-mfw-base/shared'],
    },
  },
});
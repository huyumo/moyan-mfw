import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { resolve } from 'path';

function fixVueDefaultImport(): Plugin {
  return {
    name: 'fix-vue-default-import',
    generateBundle(_, bundle) {
      const chunk = bundle['index.mjs'];
      if (chunk && chunk.type === 'chunk') {
        chunk.code = chunk.code.replace(
          /import\s+qr,\s*\{([^}]+)\}\s*from\s*["']vue["']/g,
          'import { $1 } from "vue"',
        );
      }
    },
  };
}

export default defineConfig({
  root: '.',
  plugins: [vue(), vueJsx(), fixVueDefaultImport()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'moyan-mfw-base/frontend/styles': resolve(__dirname, '../../../../base/src/frontend/src/styles'),
      'moyan-mfw-base/frontend': resolve(__dirname, '../../../../base/src/frontend/src/index.ts'),
      'moyan-mfw-base/shared': resolve(__dirname, '../../../../base/src/shared/src/index.ts'),
      'moyan-mfw-extension-ad/shared': resolve(__dirname, '../shared/src/index.ts'),
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
      external: ['vue', 'vue-router', 'element-plus', '@element-plus/icons-vue', 'moyan-mfw-base/frontend', 'moyan-mfw-base/shared'],
    },
  },
});

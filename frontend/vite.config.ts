import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  plugins: [vue(), vueJsx()],
  optimizeDeps: {
    exclude: ['@element-plus/icons-vue'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'moyan-mfw-base/frontend': resolve(__dirname, '../packages/base/src/frontend/src'),
      'moyan-mfw-base/shared': resolve(__dirname, '../packages/base/src/shared/src/index.ts'),
      'moyan-mfw-extension-ad/frontend': resolve(__dirname, '../packages/extensions/extension-ad/src/frontend/src'),
      'moyan-mfw-extension-ad/shared': resolve(__dirname, '../packages/extensions/extension-ad/src/shared/src/index.ts'),
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
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('element-plus') || id.includes('@element-plus')) {
              return 'vendor-element';
            }
            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router') || id.includes('@vue')) {
              return 'vendor-vue';
            }
            if (id.includes('moyan-mfw-base')) {
              return 'vendor-mfw';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});

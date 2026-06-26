import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { resolve } from 'path';
import { readdirSync, existsSync } from 'fs';

function discoverExtensions(baseDir: string): { dirName: string; name: string }[] {
  const extDir = resolve(baseDir, '../packages/extensions');
  if (!existsSync(extDir)) return [];
  return readdirSync(extDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith('extension-'))
    .map(d => ({ dirName: d.name, name: d.name.replace(/^extension-/, '') }));
}

function buildExtensionAliases() {
  const aliases: Record<string, string> = {};
  for (const ext of discoverExtensions(__dirname)) {
    aliases[`moyan-mfw-${ext.dirName}/frontend`] = resolve(
      __dirname,
      `../packages/extensions/${ext.dirName}/src/frontend/dist/index.mjs`,
    );
    aliases[`moyan-mfw-${ext.dirName}/shared`] = resolve(
      __dirname,
      `../packages/extensions/${ext.dirName}/src/shared/src/index.ts`,
    );
  }
  return aliases;
}

export default defineConfig({
  root: '.',
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'moyan-mfw-base/frontend': resolve(__dirname, '../packages/base/src/frontend/src'),
      'moyan-mfw-base/shared': resolve(__dirname, '../packages/base/src/shared/src/index.ts'),
      ...buildExtensionAliases(),
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
    outDir: 'dist-verify',
    target: 'es2022',
    minify: false,
    cssMinify: false,
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
            return 'vendor';
          }
        },
      },
    },
  },
});

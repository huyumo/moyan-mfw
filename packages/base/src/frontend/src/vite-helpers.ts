import type { Plugin } from 'vite';

export function fixVueDefaultImport(): Plugin {
  return {
    name: 'fix-vue-default-import',
    generateBundle(_, bundle) {
      const chunk = bundle['index.mjs'];
      if (chunk && chunk.type === 'chunk') {
        chunk.code = chunk.code
          .replace(
            /import\s+(\w+),\s*\{([^}]+)\}\s*from\s*["']vue["']/g,
            'import * as $1 from "vue";\nimport { $2 } from "vue"',
          )
          .replace(
            /import\s+(\w+)\s+from\s*["']vue["']/g,
            'import * as $1 from "vue"',
          );
      }
    },
  };
}

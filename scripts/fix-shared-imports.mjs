/**
 * @fileoverview 恢复 shared 相关 import 的一层 ../ 
 * fix-import-depth.mjs 错误地移除了 shared 引用的 ../（这些引用原本是正确的）。
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const EXTS = new Set(['ts', 'tsx', 'vue']);

function walkDir(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!entry.startsWith('.') && entry !== 'node_modules' && entry !== 'dist') {
        results.push(...walkDir(full));
      }
    } else if (EXTS.has(entry.split('.').pop())) {
      results.push(full);
    }
  }
  return results;
}

let totalChanges = 0;

function fixFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let changed = false;

  // 匹配包含 "shared" 的 relative import
  content = content.replace(
    /(from\s+['"])(\.\.\/[^'"]*shared\/[^'"]+)(['"])/g,
    (match, prefix, importPath, suffix) => {
      // 在前面添加 ../ 
      const fixed = '../' + importPath;
      changed = true;
      totalChanges++;
      return prefix + fixed + suffix;
    }
  );

  if (changed) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✓ ${relative(ROOT, filePath)}`);
  }
}

const baseDirs = [
  resolve(ROOT, 'packages/base/src/backend/src'),
  resolve(ROOT, 'packages/base/src/frontend/src'),
  resolve(ROOT, 'packages/extensions/extension-ad/src/backend/src'),
  resolve(ROOT, 'packages/extensions/extension-ad/src/frontend/src'),
];

for (const dir of baseDirs) {
  console.log(`\n=== Fix ${relative(ROOT, dir)} ===`);
  for (const f of walkDir(dir)) {
    fixFile(f);
  }
}

console.log(`\n=== Done: ${totalChanges} changes made ===`);

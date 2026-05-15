/**
 * @fileoverview 修复 move-to-src-layout.mjs 引入的 import 路径错误。
 * 由于源文件和目标文件同时移入 src/ 子目录，相对路径本应保持不变，
 * 但 move-to-src-layout.mjs 错误地给所有 relative import 多加了一层 ../。
 * 此脚本移除多余的那一层 ../。
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

/**
 * 移除 import 路径中开头的一个 ../ 层级。
 * 如果路径恰好是 "../xxx"，则变为 "./xxx"。
 * 如果路径以 "../../" 开头，移除开头的 "../"。
 */
function removeOneUpLevel(importPath) {
  if (importPath.startsWith('../')) {
    // 去掉开头的 ../
    const rest = importPath.slice(3);
    if (!rest.startsWith('.')) {
      // ../sibling → ./sibling
      return './' + rest;
    }
    // ../../xxx → ../xxx
    return rest;
  }
  return importPath;
}

let totalChanges = 0;

function fixFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let changed = false;

  // 匹配所有 relative import：from '../xxx' 或 from "../xxx"
  content = content.replace(
    /(from\s+['"])(\.\.\/[^'"]+)(['"])/g,
    (match, prefix, importPath, suffix) => {
      const fixed = removeOneUpLevel(importPath);
      if (fixed !== importPath) {
        changed = true;
        totalChanges++;
      }
      return prefix + fixed + suffix;
    }
  );

  // 匹配动态 import：import('../xxx')
  content = content.replace(
    /(import\s*\(\s*['"])(\.\.\/[^'"]+)(['"])/g,
    (match, prefix, importPath, suffix) => {
      const fixed = removeOneUpLevel(importPath);
      if (fixed !== importPath) {
        changed = true;
        totalChanges++;
      }
      return prefix + fixed + suffix;
    }
  );

  if (changed) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✓ ${relative(ROOT, filePath)}`);
  }
}

// ========== packages/base ==========
const baseDirs = [
  resolve(ROOT, 'packages/base/src/backend/src'),
  resolve(ROOT, 'packages/base/src/frontend/src'),
];

for (const dir of baseDirs) {
  console.log(`\n=== Fix ${relative(ROOT, dir)} ===`);
  for (const f of walkDir(dir)) {
    fixFile(f);
  }
}

// ========== packages/extensions/extension-ad ==========
const adDirs = [
  resolve(ROOT, 'packages/extensions/extension-ad/src/backend/src'),
  resolve(ROOT, 'packages/extensions/extension-ad/src/frontend/src'),
];

for (const dir of adDirs) {
  console.log(`\n=== Fix ${relative(ROOT, dir)} ===`);
  for (const f of walkDir(dir)) {
    fixFile(f);
  }
}

console.log(`\n=== Done: ${totalChanges} changes made ===`);

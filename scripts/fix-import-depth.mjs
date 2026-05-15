/**
 * @fileoverview 修复所有因嵌套 src/ 导致的错误 relative import 路径。
 * 直接计算每个文件到目标模块的正确相对路径并替换。
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve, relative, sep } from 'path';
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
 * 计算从 file 到 targetDir 的正确相对导入路径
 */
function relImport(file, targetDir) {
  const d = dirname(file);
  let r = relative(d, targetDir).split(sep).join('/');
  if (!r.startsWith('.')) r = './' + r;
  return r;
}

// ========== base/backend: 修复内部和 shared 的相对路径 ==========
const baseBackendSrc = resolve(ROOT, 'packages/base/src/backend/src');
const baseShared = resolve(ROOT, 'packages/base/src/shared');

console.log('=== Fix packages/base/src/backend/src/ ===');
for (const f of walkDir(baseBackendSrc)) {
  let content = readFileSync(f, 'utf-8');
  let changed = false;

  // 修复 shared 引用：从 @internal/base-shared 或错误的相对路径
  // 现在的模式可能是 ../../../../../../shared 或 ../../../../../../shared/src
  content = content.replace(
    /from\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/shared(?:\/src)?['"]/g,
    () => {
      changed = true;
      const correct = relImport(f, baseShared);
      return `from '${correct}'`;
    }
  );
  // 也匹配 5 层路径到 shared
  content = content.replace(
    /from\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/shared(?:\/src)?['"]/g,
    () => {
      changed = true;
      const correct = relImport(f, baseShared);
      return `from '${correct}'`;
    }
  );

  if (changed) {
    writeFileSync(f, content, 'utf-8');
    console.log(`  [shared] ${relative(ROOT, f)} → ${relImport(f, baseShared)}`);
  }
}

// ========== base/frontend: 修复 shared 引用 ==========
const baseFrontendSrc = resolve(ROOT, 'packages/base/src/frontend/src');
console.log('\n=== Fix packages/base/src/frontend/src/ ===');
for (const f of walkDir(baseFrontendSrc)) {
  let content = readFileSync(f, 'utf-8');
  let changed = false;

  content = content.replace(
    /from\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/shared(?:\/src)?['"]/g,
    () => {
      changed = true;
      const correct = relImport(f, baseShared);
      return `from '${correct}'`;
    }
  );

  if (changed) {
    writeFileSync(f, content, 'utf-8');
    console.log(`  [shared] ${relative(ROOT, f)} → ${relImport(f, baseShared)}`);
  }
}

// ========== extension-ad/backend: 修复 @internal 已替换为 moyan-mfw-base 的引用 ==========
// extension-ad 引用 base 的路径是 moyan-mfw-base/xxx，这个不需要改。
// 但内部引用 ad-shared 可能有问题。
const adBackendSrc = resolve(ROOT, 'packages/extensions/extension-ad/src/backend/src');
const adShared = resolve(ROOT, 'packages/extensions/extension-ad/src/shared');

console.log('\n=== Fix packages/extensions/extension-ad/src/backend/src/ ===');
for (const f of walkDir(adBackendSrc)) {
  let content = readFileSync(f, 'utf-8');
  let changed = false;

  // 修复 @internal/ad-shared → 相对路径 (已由第一次迁移处理，这里确保正确)
  content = content.replace(
    /from\s+['"]\.\.\/\.\.\/\.\.\/shared(?:\/src)?['"]/g,
    () => {
      changed = true;
      const correct = relImport(f, adShared);
      return `from '${correct}'`;
    }
  );

  if (changed) {
    writeFileSync(f, content, 'utf-8');
    console.log(`  [ad-shared] ${relative(ROOT, f)} → ${relImport(f, adShared)}`);
  }
}

// ========== extension-ad/frontend: 同样修复 ==========
const adFrontendSrc = resolve(ROOT, 'packages/extensions/extension-ad/src/frontend/src');
console.log('\n=== Fix packages/extensions/extension-ad/src/frontend/src/ ===');
for (const f of walkDir(adFrontendSrc)) {
  let content = readFileSync(f, 'utf-8');
  let changed = false;

  content = content.replace(
    /from\s+['"]\.\.\/\.\.\/\.\.\/shared(?:\/src)?['"]/g,
    () => {
      changed = true;
      const correct = relImport(f, adShared);
      return `from '${correct}'`;
    }
  );

  if (changed) {
    writeFileSync(f, content, 'utf-8');
    console.log(`  [ad-shared] ${relative(ROOT, f)} → ${relImport(f, adShared)}`);
  }
}

console.log('\n=== Done ===');

/**
 * @fileoverview 迁移脚本：将 extension-ad 包内所有跨包引用替换为 @internal/* 命名空间
 * @description
 *   替换规则：
 *     moyan-mfw-base/backend  → @internal/base-backend
 *     moyan-mfw-base/frontend → @internal/base-frontend
 *     moyan-mfw-base/shared   → @internal/base-shared
 *     内部相对路径 → shared/  → @internal/ad-shared
 *
 * 用法：node packages/extensions/extension-ad/scripts/migrate-internal-imports.mjs
 * 前置条件：pnpm install 已完成，子包 package.json + tsconfig 已就位
 * 验证：替换后运行 pnpm --filter @internal/ad-backend build 等
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname, sep } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_DIR = resolve(__dirname, '..');
const SRC_DIR = resolve(BASE_DIR, 'src');

const REPLACEMENT_RULES = [
  {
    name: 'base/backend → @internal/base-backend (import)',
    pattern: /from\s+['"]moyan-mfw-base\/backend['"]/g,
    replacement: "from '../backend'",
  },
  {
    name: 'base/backend → @internal/base-backend (require)',
    pattern: /require\(['"]moyan-mfw-base\/backend['"]\)/g,
    replacement: "require('../backend')",
  },
  {
    name: 'base/frontend → @internal/base-frontend (import)',
    pattern: /from\s+['"]moyan-mfw-base\/frontend['"]/g,
    replacement: "from '../frontend'",
  },
  {
    name: 'base/frontend → @internal/base-frontend (side-effect)',
    pattern: /import\s+['"]moyan-mfw-base\/frontend/g,
    replacement: "import '../frontend",
  },
  {
    name: 'base/shared → @internal/base-shared',
    pattern: /from\s+['"]moyan-mfw-base\/shared['"]/g,
    replacement: "from '../shared'",
  },
  {
    name: '内部 shared 相对路径 → @internal/ad-shared',
    pattern: /from\s+['"]((?:\.\.\/)+shared(?:\/[\w-]+)?)['"]/g,
    replacement: "from '../dist/shared/index.js'",
  },
];

function collectTargetFiles() {
  const results = [];

  function walk(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = resolve(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        walk(fullPath);
      } else if (entry.isFile() && /\.(ts|vue|mjs)$/.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }

  walk(SRC_DIR);
  return results;
}

function findMatchingRules(content) {
  return REPLACEMENT_RULES.filter((rule) => rule.pattern.test(content));
}

function applyReplacements(content, rules) {
  let result = content;
  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    result = result.replace(rule.pattern, rule.replacement);
  }
  return result;
}

function main() {
  console.log('=== extension-ad 包 import 引用迁移脚本 ===\n');
  console.log(`源目录: ${SRC_DIR}\n`);

  const allFiles = collectTargetFiles();
  console.log(`扫描到 ${allFiles.length} 个源文件\n`);

  let totalChanged = 0;
  let fileCount = 0;

  for (const absPath of allFiles) {
    const content = readFileSync(absPath, 'utf-8');
    const matchingRules = findMatchingRules(content);

    if (matchingRules.length === 0) continue;

    // Reset lastIndex for all rules before applying
    for (const rule of matchingRules) {
      rule.pattern.lastIndex = 0;
    }

    const newContent = applyReplacements(content, matchingRules);
    const shortPath = absPath.replace(BASE_DIR + sep, '');

    fileCount++;
    console.log(`[${String(fileCount).padStart(2, '0')}] ${shortPath}`);

    for (const rule of matchingRules) {
      rule.pattern.lastIndex = 0;
      const matches = content.match(rule.pattern);
      if (matches) {
        const count = matches.length;
        totalChanged += count;
        console.log(`      ${rule.name} (${count} 处)`);
        for (const m of matches) {
          console.log(`        旧: ${m}`);
          console.log(`        新: ${m.replace(rule.pattern, rule.replacement)}`);
        }
      }
    }
    console.log('');

    writeFileSync(absPath, newContent, 'utf-8');
  }

  console.log(`\n✅ 迁移完成！修改 ${fileCount} 个文件，共 ${totalChanged} 处替换。`);
  console.log('\n下一步验证：');
  console.log('  1. pnpm --filter @internal/ad-backend build');
  console.log('  2. pnpm --filter @internal/ad-frontend build');
  console.log('  3. pnpm --filter @internal/ad-shared build');
  console.log('  4. 检查 dist/ 产物中的 require() 路径');
}

main();
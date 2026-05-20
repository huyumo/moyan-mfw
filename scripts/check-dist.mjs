import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const FAIL = '\x1b[31mFAIL\x1b[0m';
const PASS = '\x1b[32mPASS\x1b[0m';

const VUE_BARE_DEFAULT_RE = /^import\s+\w+,\s*\{[\s\S]*?\}\s*from\s*["']vue["']/m;

function discoverExtensions() {
  const extDir = path.join(rootDir, 'packages', 'extensions');
  if (!fs.existsSync(extDir)) return [];
  return fs.readdirSync(extDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith('extension-'))
    .map(d => ({ dirName: d.name, name: d.name.replace(/^extension-/, '') }));
}

function buildChecks() {
  const checks = [];

  checks.push({
    name: 'moyan-mfw-base (ESM)',
    file: 'packages/base/src/frontend/dist/index.mjs',
    rules: [
      {
        name: 'no bare default import from "vue"',
        fn: (content) => !VUE_BARE_DEFAULT_RE.test(content),
        fix: 'import xxx, { ... } from "vue" → 拆为两行 import * as xxx from "vue"; import { ... } from "vue"',
      },
    ],
  });

  checks.push({
    name: 'moyan-mfw-base (CJS)',
    file: 'packages/base/src/frontend/dist/index.js',
    rules: [
      {
        name: 'exports "buildRoutesFromModuleTree"',
        fn: (content) => content.includes('buildRoutesFromModuleTree'),
        fix: '确保 buildRoutesFromModuleTree 在 base/frontend 中正确导出',
      },
    ],
  });

  checks.push({
    name: 'moyan-mfw-base (vite-helpers ESM)',
    file: 'packages/base/src/frontend/dist/vite-helpers.mjs',
    rules: [
      {
        name: 'file exists',
        fn: () => true,
      },
    ],
  });

  checks.push({
    name: 'moyan-mfw-base (vite-helpers CJS)',
    file: 'packages/base/src/frontend/dist/vite-helpers.js',
    rules: [
      {
        name: 'file exists',
        fn: () => true,
      },
    ],
  });

  for (const ext of discoverExtensions()) {

    checks.push({
      name: `moyan-mfw-${ext.dirName} (ESM)`,
      file: `packages/extensions/${ext.dirName}/src/frontend/dist/index.mjs`,
      rules: [
        {
          name: 'no bare default import from "vue"',
          fn: (content) => !VUE_BARE_DEFAULT_RE.test(content),
          fix: '检查 vite.config.mts 中 fixVueDefaultImport 插件是否正常',
        },
        {
          name: 'exports routes',
          fn: (content) => /Routes\b/.test(content),
          fix: `确保 src/index.ts 中 export const xxxRoutes 存在`,
        },
      ],
    });

    checks.push({
      name: `moyan-mfw-${ext.dirName} (shared)`,
      file: `packages/extensions/${ext.dirName}/src/shared/dist/index.js`,
      rules: [
        {
          name: 'file exists',
          fn: () => true,
        },
      ],
    });
  }

  return checks;
}

const checks = buildChecks();
let failed = 0;

for (const check of checks) {
  const filePath = path.join(rootDir, check.file);

  if (!fs.existsSync(filePath)) {
    console.log(`${FAIL}  ${check.name}: dist 文件缺失 (${check.file})`);
    failed++;
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  let allPassed = true;

  for (const rule of check.rules) {
    if (rule.fn(content)) {
      console.log(`  ${PASS}  ${rule.name}`);
    } else {
      console.log(`  ${FAIL}  ${rule.name}`);
      console.log(`       → ${rule.fix}`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log(`${PASS}  ${check.name}`);
  } else {
    console.log(`${FAIL}  ${check.name}`);
    failed++;
  }
}

console.log('');
if (failed > 0) {
  console.log(`${FAIL}  ${failed} 项检查未通过 — 阻塞发布`);
  process.exit(1);
} else {
  console.log(`${PASS}  所有 dist 产物检查通过`);
}

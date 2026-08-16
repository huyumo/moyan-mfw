import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const FAIL = '\x1b[31mFAIL\x1b[0m';
const PASS = '\x1b[32mPASS\x1b[0m';

const VUE_BARE_DEFAULT_RE = /^import\s+\w+,\s*\{[\s\S]*?\}\s*from\s*["']vue["']/m;
// ESM 产物必须保留具名导出（export 子句中的 as 别名/标识符导出）
const ESM_EXPORT_RE = /export\s*\{[^}]*\b(as|[A-Za-z_$])/;
// 扩展前端产物必须带样式文件（页面组件依赖 base/element-plus 样式）
const FRONTEND_STYLE_FILE = 'src/frontend/dist/style.css';

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
        name: 'has named exports',
        fn: (content) => ESM_EXPORT_RE.test(content) || /exports\.[A-Za-z_$]/.test(content),
        fix: '确保 base/frontend 构建产物包含具名导出',
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
          // 扩展前端只导出页面组件（路由由使用方 menu-trees.ts 维护），
          // 因此校验"存在具名导出"而非旧的 Routes 导出
          name: 'has named exports',
          fn: (content) => ESM_EXPORT_RE.test(content),
          fix: `确保 src/index.ts 存在页面组件导出`,
        },
        {
          name: 'style.css emitted',
          fn: () => fs.existsSync(path.join(rootDir, `packages/extensions/${ext.dirName}`, FRONTEND_STYLE_FILE)),
          fix: '检查 vite build 是否产出 style.css',
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

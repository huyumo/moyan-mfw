import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const frontendDist = path.join(packageRoot, 'src/frontend/dist');
const backendDist = path.join(packageRoot, 'src/backend/dist');
const sharedDist = path.join(packageRoot, 'src/shared/dist');

const FAIL = '\x1b[31mFAIL\x1b[0m';
const PASS = '\x1b[32mPASS\x1b[0m';

let failed = 0;

function checkFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.log(`  ${FAIL}  ${label}`);
    console.log(`       → 缺失 ${path.relative(packageRoot, filePath)}，请先运行 pnpm build`);
    failed++;
    return false;
  }

  console.log(`  ${PASS}  ${label}`);
  return true;
}

const frontendEntry = path.join(frontendDist, 'index.mjs');
const hasFrontendEntry = checkFile(frontendEntry, 'frontend dist/index.mjs exists');
checkFile(path.join(frontendDist, 'index.d.ts'), 'frontend dist/index.d.ts exists');
checkFile(path.join(frontendDist, 'style.css'), 'frontend dist/style.css exists');
checkFile(path.join(backendDist, 'index.js'), 'backend dist/index.js exists');
checkFile(path.join(backendDist, 'index.d.ts'), 'backend dist/index.d.ts exists');
checkFile(path.join(sharedDist, 'index.js'), 'shared dist/index.js exists');
checkFile(path.join(sharedDist, 'index.d.ts'), 'shared dist/index.d.ts exists');

if (hasFrontendEntry) {
  const content = fs.readFileSync(frontendEntry, 'utf-8');

  if (/^import\s+\w+,\s*\{[\s\S]*?\}\s*from\s*["']vue["']/m.test(content)) {
    console.log(`  ${FAIL}  no bare default import from "vue"`);
    console.log('       → 检查 vite.config.mts 中是否配置了 fixVueDefaultImport 插件');
    failed++;
  } else {
    console.log(`  ${PASS}  no bare default import from "vue"`);
  }

  if (!/MfwDocumentManager\b/.test(content)) {
    console.log(`  ${FAIL}  exports MfwDocumentManager`);
    console.log('       → 确保 src/index.ts 正确导出 MfwDocumentManager');
    failed++;
  } else {
    console.log(`  ${PASS}  exports MfwDocumentManager`);
  }
}

console.log('');
if (failed > 0) {
  console.log(`${FAIL}  文档管理: ${failed} 项检查未通过 — 阻塞发布`);
  process.exit(1);
}

console.log(`${PASS}  文档管理 dist 产物检查通过`);

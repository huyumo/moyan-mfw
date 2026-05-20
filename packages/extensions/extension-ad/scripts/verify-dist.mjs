import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(__dirname, '../src/frontend/dist');

const FAIL = '\x1b[31mFAIL\x1b[0m';
const PASS = '\x1b[32mPASS\x1b[0m';

const distFile = path.join(frontendDist, 'index.mjs');

if (!fs.existsSync(distFile)) {
  console.log(`${FAIL}  广告管理: dist/index.mjs 缺失，请先运行 pnpm build`);
  process.exit(1);
}

const content = fs.readFileSync(distFile, 'utf-8');
let failed = 0;

if (/^import\s+\w+,\s*\{[\s\S]*?\}\s*from\s*["']vue["']/m.test(content)) {
  console.log(`  ${FAIL}  no bare default import from "vue"`);
  console.log('       → 检查 vite.config.mts 中是否配置了 fixVueDefaultImport 插件');
  failed++;
} else {
  console.log(`  ${PASS}  no bare default import from "vue"`);
}

if (!/Routes\b/.test(content)) {
  console.log(`  ${FAIL}  exports Routes`);
  console.log('       → 确保 src/index.ts 中正确导出 xxxRoutes');
  failed++;
} else {
  console.log(`  ${PASS}  exports Routes`);
}

console.log('');
if (failed > 0) {
  console.log(`${FAIL}  广告管理: ${failed} 项检查未通过 — 阻塞发布`);
  process.exit(1);
} else {
  console.log(`${PASS}  广告管理 dist 产物检查通过`);
}

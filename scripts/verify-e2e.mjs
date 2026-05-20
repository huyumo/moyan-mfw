/**
 * 端到端验证脚本：模拟真实消费者链路
 *
 * 验证流程：
 *   1. 构建所有包
 *   2. pnpm pack 各发布包 → .tgz
 *   3. mfw create business 创建业务项目
 *   4. 安装本地 .tgz 替换 npm 依赖
 *   5. 构建业务项目（shared + frontend）
 *   6. 启动前端 dev server
 *   7. 浏览器访问 → 检查 CSS 加载 + JS 报错
 *   8. 清理临时文件
 *
 * 用法：
 *   node scripts/verify-e2e.mjs
 */

import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import { createServer } from 'net';
import { chromium } from '@playwright/test';

const ROOT = resolve(import.meta.dirname, '..');
const TEMP_DIR = join(ROOT, '.e2e-verify');
const PROJECT_NAME = 'e2e-verify';

const PACKAGES_TO_PACK = [
  { name: 'moyan-mfw-base', dir: 'packages/base' },
  { name: 'moyan-mfw-extension-ad', dir: 'packages/extensions/extension-ad' },
];

const failures = [];

function run(command, options = {}) {
  try {
    return execSync(command, {
      cwd: options.cwd || ROOT,
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf-8',
      ...options,
    });
  } catch (error) {
    if (!options.ignoreError) {
      console.error(`\n❌ 命令失败: ${command}`);
      console.error(error.stderr || error.message);
      process.exit(1);
    }
    return null;
  }
}

function getAvailablePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => resolvePort(port));
    });
    server.on('error', reject);
  });
}

function waitForServer(port, timeoutMs = 30000) {
  return new Promise((resolvePromise, reject) => {
    const startTime = Date.now();
    const check = () => {
      if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`服务启动超时 (端口 ${port})`));
        return;
      }
      try {
        execSync(`curl -s http://localhost:${port}`, { stdio: 'pipe' });
        resolvePromise();
      } catch {
        setTimeout(check, 1000);
      }
    };
    check();
  });
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  🔍 moyan-mfw 端到端发布验证');
  console.log('═══════════════════════════════════════════\n');

  // 清理临时目录
  if (existsSync(TEMP_DIR)) {
    console.log('🧹 清理旧的临时目录...');
    rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  mkdirSync(join(TEMP_DIR, 'packs'), { recursive: true });

  // ── 步骤 1：构建所有包 ──
  console.log('\n📦 步骤 1/7：构建所有包...');
  run('pnpm build');

  // ── 步骤 2：pnpm pack 各发布包 ──
  console.log('\n📦 步骤 2/7：打包各发布包...');
  const packedFiles = [];
  for (const pkg of PACKAGES_TO_PACK) {
    const cwd = join(ROOT, pkg.dir);
    console.log(`  → ${pkg.name}`);
    const output = run(`pnpm pack --pack-destination "${join(TEMP_DIR, 'packs')}"`, {
      cwd,
      silent: true,
    });
    const lines = output.trim().split('\n');
    const tgzLine = lines[lines.length - 1].trim();
    packedFiles.push({ name: pkg.name, tgzPath: tgzLine });
  }

  // ── 步骤 3：创建业务项目 ──
  console.log('\n📦 步骤 3/7：创建业务项目...');
  const cliBin = join(ROOT, 'packages', 'cli', 'bin', 'mfw.js');
  run(`node "${cliBin}" create business ${PROJECT_NAME} -d "${TEMP_DIR}" -y --force`);

  const projectDir = join(TEMP_DIR, PROJECT_NAME);
  if (!existsSync(projectDir)) {
    console.error('❌ 项目创建失败');
    process.exit(1);
  }

  // ── 步骤 4：安装本地依赖 ──
  console.log('\n📦 步骤 4/7：安装依赖...');
  run('pnpm install --no-frozen-lockfile', { cwd: projectDir });

  for (const packed of packedFiles) {
    const localTgz = resolve(TEMP_DIR, 'packs', packed.tgzPath.split(/[/\\]/).pop());
    console.log(`  → ${packed.name}: ${localTgz}`);
    run(`pnpm --filter ${PROJECT_NAME}-frontend add "file:${localTgz}"`, { cwd: projectDir });
  }

  // ── 步骤 5：构建业务项目 ──
  console.log('\n📦 步骤 5/7：构建业务项目...');
  run('pnpm build', { cwd: projectDir });

  // ── 步骤 6：浏览器验证 ──
  console.log('\n📦 步骤 6/7：浏览器验证...');

  const port = await getAvailablePort();

  // 启动前端 dev server
  let frontendProcess;
  try {
    frontendProcess = spawn('pnpm', [
      '--filter', `${PROJECT_NAME}-frontend`,
      'dev',
      '--port', String(port),
    ], {
      cwd: projectDir,
      stdio: 'pipe',
      shell: true,
    });

    frontendProcess.stderr.on('data', () => {});
  } catch (err) {
    failures.push(`无法启动前端服务: ${err.message}`);
  }

  let browser = null;
  try {
    console.log(`  ⏳ 等待前端启动 (端口 ${port})...`);
    await waitForServer(port, 60000);
    console.log('  ✅ 前端已启动');

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.goto(`http://localhost:${port}/`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 检查 CSS 加载
    const cssResult = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      let ruleCount = 0;
      for (const sheet of sheets) {
        try { ruleCount += sheet.cssRules?.length || 0; } catch {}
      }
      return {
        styleTags: document.querySelectorAll('style').length,
        linkTags: document.querySelectorAll('link[rel="stylesheet"]').length,
        ruleCount,
        bodyText: document.body?.innerText?.substring(0, 100) || '',
      };
    });

    console.log(`  → <style> 标签: ${cssResult.styleTags}`);
    console.log(`  → <link> 样式: ${cssResult.linkTags}`);
    console.log(`  → CSS 规则数: ${cssResult.ruleCount}`);

    if (cssResult.ruleCount < 50) {
      failures.push(`CSS 规则数过少 (${cssResult.ruleCount})，样式未加载`);
    } else {
      console.log('  ✅ CSS 已加载');
    }

    // 检查 JS 运行时错误
    // 过滤已知无害错误：无后端、console 网络请求失败等
    const harmfulErrors = pageErrors.filter(e => {
      if (e.includes('favicon.ico')) return false;
      if (e.includes('ERR_CONNECTION_REFUSED')) return false;
      if (e.includes('Failed to load resource')) return false;
      if (e.includes('请求错误')) return false;
      if (e.includes('Network Error')) return false;
      if (e.includes('net::ERR')) return false;
      return true;
    });

    if (harmfulErrors.length > 0) {
      console.log(`  ❌ 页面 JS 错误 (${harmfulErrors.length}):`);
      harmfulErrors.slice(0, 5).forEach(e => console.log(`      ${e}`));
      failures.push(`${harmfulErrors.length} 个 JS 页面错误`);
    } else {
      console.log('  ✅ 无 JS 运行时错误');
    }

    await page.screenshot({
      path: join(TEMP_DIR, 'e2e-screenshot.png'),
      fullPage: true,
    });
    console.log(`  📸 截图: ${join(TEMP_DIR, 'e2e-screenshot.png')}`);

  } catch (error) {
    failures.push(`浏览器验证异常: ${error.message}`);
  } finally {
    if (browser) await browser.close();
    if (frontendProcess) {
      frontendProcess.kill();
    }
  }

  // ── 步骤 7：结果 ──
  console.log('\n═══════════════════════════════════════════');

  if (failures.length === 0) {
    console.log('  ✅ 端到端验证通过！');
    console.log('═══════════════════════════════════════════\n');
    if (existsSync(TEMP_DIR)) {
      rmSync(TEMP_DIR, { recursive: true, force: true });
    }
    process.exit(0);
  } else {
    console.log('  ❌ 端到端验证失败：');
    failures.forEach(f => console.log(`    - ${f}`));
    console.log(`\n  💡 临时文件保留在: ${TEMP_DIR}`);
    console.log('═══════════════════════════════════════════\n');
    process.exit(1);
  }
}

main();

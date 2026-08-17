/**
 * @fileoverview Changesets 发布封装脚本（本地准备阶段）
 * @description 流程：changesets:gen（从提交预填）-> 人工确认 -> changeset version
 *   -> 提交 release commit -> 为每个新版本包打 moyan-mfw-*@<version> tag -> push。
 *   push 后由 release-pipeline 自动构建并执行 changeset publish（幂等）。
 *
 * 用法：
 *   pnpm release            # 交互确认后执行完整流程
 *   pnpm release --yes      # 跳过确认（CI/脚本场景）
 *
 * 与旧版（lockstep + beta-v* tag）的区别：
 * - 版本 bump 由 .changeset/ 内容决定，只发有变更的包；
 * - tag 格式为逐包的 <pkg-name>@<version>，发布幂等可重跑；
 * - beta 通道改用 `pnpm changeset pre enter/exit beta` 控制。
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

function sh(cmd: string, opts: { inherit?: boolean } = {}): string {
  return execSync(cmd, {
    encoding: 'utf-8',
    stdio: opts.inherit ? 'inherit' : 'pipe',
    maxBuffer: 64 * 1024 * 1024,
  });
}

function hasUncommittedChanges() {
  try {
    execSync('git diff --quiet', { stdio: 'pipe' });
    execSync('git diff --cached --quiet', { stdio: 'pipe' });
    return false;
  } catch {
    return true;
  }
}

function listPendingChangesets() {
  return readdirSync('.changeset').filter((f) => f.endsWith('.md') && f !== 'README.md');
}

/** 读取 changeset version 之后被 bump 的包：对比 git HEAD 中各 package.json 的版本差异 */
function bumpedPackages() {
  const dirs = [
    'packages/base',
    'packages/cli',
    ...readdirSync('packages/extensions', { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith('extension-'))
      .map((d) => `packages/extensions/${d.name}`),
  ];
  const result = [];
  for (const dir of dirs) {
    const file = join(dir, 'package.json');
    const current = JSON.parse(readFileSync(file, 'utf-8'));
    if (current.private === true) continue;
    let old = null;
    try {
      old = JSON.parse(sh(`git show HEAD:${file.replace(/\\/g, '/')}`));
    } catch {
      /* 新包，HEAD 中不存在 */
    }
    if (!old || old.version !== current.version) {
      result.push({ name: current.name, version: current.version });
    }
  }
  return result;
}

async function main() {
  const skipConfirm = process.argv.includes('--yes');

  console.log('🦋 Changesets 发布流程\n');

  // 0. 前置检查：工作区必须干净（避免把未提交改动卷进 release commit）
  if (hasUncommittedChanges()) {
    console.error('❌ 工作区存在未提交改动，请先提交或贮藏后再发版');
    console.error('   （旧版脚本的自动 stash 已移除：release commit 应只包含版本变更）');
    process.exit(1);
  }

  // 1. 预填 changeset（从 conventional commits 生成，人工应在此前已过目）
  console.log('1️⃣  从提交记录预填 changeset...');
  sh('node scripts/gen-changesets.mjs', { inherit: true });

  const pending = listPendingChangesets();
  if (pending.length === 0) {
    console.log('\n没有待发版 changeset（无发布范围变更），流程结束。');
    process.exit(0);
  }

  console.log(`\n待发版 changeset（${pending.length} 个）：`);
  for (const f of pending) console.log(`  - .changeset/${f}`);

  if (!skipConfirm) {
    const { createInterface } = await import('readline/promises');
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question('\n确认发版？(y/N) ');
    rl.close();
    if (!/^y(es)?$/i.test(answer.trim())) {
      console.log('已取消。（可先人工调整 .changeset/ 后重新执行）');
      process.exit(0);
    }
  }

  // 2. 应用版本变更（bump + 生成 CHANGELOG + 消费 .changeset/*.md）
  console.log('\n2️⃣  执行 changeset version...');
  sh('pnpm changeset version', { inherit: true });

  // 2.5 同步 lockfile：changesets 改写 peer/依赖范围后必须刷新 pnpm-lock.yaml，
  //     否则 CI 的 --frozen-lockfile 会因 specifier 不一致直接失败
  console.log('\n2️⃣.5 同步 pnpm-lock.yaml...');
  sh('pnpm install --lockfile-only', { inherit: true });

  // 3. 提交 release commit
  const bumped = bumpedPackages();
  if (bumped.length === 0) {
    console.log('\n版本未发生变化（changeset 均为空变更？），流程结束。');
    process.exit(0);
  }
  const summary = bumped.map((b) => `${b.name}@${b.version}`).join(', ');
  console.log(`\n3️⃣  提交 release commit：${summary}`);
  sh('git add .changeset packages pnpm-lock.yaml', { inherit: true });
  sh(`git commit -m "chore: release ${summary}" --no-verify`, { inherit: true });

  // 4. 逐包打 tag（changesets 风格 <pkg>@<version>，触发 release-pipeline）
  console.log('\n4️⃣  创建发布 tag...');
  const tags = [];
  for (const pkg of bumped) {
    const tag = `${pkg.name}@${pkg.version}`;
    let existsLocally = false;
    try {
      execSync(`git rev-parse ${tag}`, { stdio: 'pipe' });
      existsLocally = true;
    } catch { /* tag 不存在 */ }
    if (existsLocally) {
      console.log(`  = ${tag} 已存在，跳过（重跑场景）`);
      tags.push(tag);
      continue;
    }
    sh(`git tag ${tag}`, { inherit: true });
    tags.push(tag);
  }

  // 5. 推送
  console.log('\n5️⃣  推送到远程...');
  sh(`git push origin HEAD ${tags.map((t) => `refs/tags/${t}`).join(' ')}`, { inherit: true });

  console.log('\n✅ 发布准备完成！');
  console.log('   release-pipeline 将自动构建并发布到 npm（changeset publish，幂等）。');
  console.log('   已推送 tag：');
  for (const t of tags) console.log(`   - ${t}`);
}

main().catch((error) => {
  console.error(`\n❌ 发布失败：${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

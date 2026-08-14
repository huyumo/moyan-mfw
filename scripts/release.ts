/**
 * @fileoverview 统一版本号管理脚本
 * @description 同步更新所有包的版本号到根 package.json 的版本
 *
 * 安全机制：
 * - 发布前自动 stash 未提交的改动，防止 pre-commit 失败导致代码被误回滚
 * - 失败时仅回滚版本号变更，恢复原始工作区改动
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const PACKAGES = [
  'packages/base',
  'packages/cli',
  'packages/extensions/extension-ad',
  'packages/extensions/extension-config',
  'packages/extensions/extension-document',
  'packages/extensions/extension-scheduler',
  'packages/extensions/extension-ledger',
];

function getCurrentVersion(): string {
  const rootPackage = JSON.parse(readFileSync('package.json', 'utf-8'));
  return rootPackage.version;
}

function updatePackageVersion(packagePath: string, version: string): boolean {
  const packageJsonPath = join(packagePath, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  const oldVersion = packageJson.version;
  if (oldVersion === version) {
    console.log(`  ${packageJson.name}: 已是 ${version}，无需更新`);
    return false;
  }

  packageJson.version = version;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✓ ${packageJson.name}: ${oldVersion} → ${version}`);
  return true;
}

function hasUncommittedChanges(): boolean {
  try {
    execSync('git diff --quiet', { stdio: 'pipe' });
    execSync('git diff --cached --quiet', { stdio: 'pipe' });
    return false;
  } catch {
    return true;
  }
}

function tagExists(tag: string): boolean {
  try {
    execSync(`git rev-parse ${tag}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function main() {
  const releaseType = process.argv[2];

  if (!releaseType || !['patch', 'minor', 'major', 'prerelease'].includes(releaseType)) {
    console.error('Usage: pnpm release:<type>');
    console.error('  patch      - 1.0.0 → 1.0.1 (bug fixes)');
    console.error('  minor      - 1.0.0 → 1.1.0 (new features)');
    console.error('  major      - 1.0.0 → 2.0.0 (breaking changes)');
    console.error('  prerelease - 1.0.0 → 1.0.1-beta.0 (beta release)');
    process.exit(1);
  }

  console.log(`🚀 开始发布新版本 (${releaseType})...\n`);

  let originalHead = '';
  let tagName = '';
  let tagCreated = false;
  let stashed = false;

  try {
    // 保存当前 HEAD
    originalHead = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();

    // 暂存未提交的改动，防止发布失败时被一起回滚
    if (hasUncommittedChanges()) {
      console.log('💾 暂存工作区未提交的改动...');
      execSync('git stash push -m "release: pre-bump auto stash"', { stdio: 'inherit' });
      stashed = true;
      console.log('  ✓ 已暂存\n');
    }

    // 1. 更新根版本号
    console.log('1️⃣  更新根 package.json 版本...');
    if (releaseType === 'prerelease') {
      execSync('npm version prerelease --preid=beta --no-git-tag-version', { stdio: 'inherit' });
    } else {
      execSync(`npm version ${releaseType} --no-git-tag-version`, { stdio: 'inherit' });
    }
    const newVersion = getCurrentVersion();

    // 2. 同步所有包的版本
    console.log('\n2️⃣  同步所有包的版本...');
    let hasUpdates = false;
    PACKAGES.forEach((pkg) => {
      if (updatePackageVersion(pkg, newVersion)) {
        hasUpdates = true;
      }
    });

    // 3. 提交更改
    const tagPrefix = releaseType === 'prerelease' ? 'beta-v' : 'v';

    // 仅暂存 package.json 版本变更（避免 git add -A 引入不该提交的文件）
    execSync('git add package.json', { stdio: 'inherit' });
    PACKAGES.forEach((pkg) => {
      execSync(`git add ${pkg}/package.json`, { stdio: 'inherit' });
    });

    if (hasUpdates) {
      console.log('\n3️⃣  提交版本更新...');
      execSync(`git commit -m "chore: release ${tagPrefix}${newVersion}" --no-verify`, { stdio: 'inherit' });
    } else {
      console.log('\n3️⃣  版本号已同步，无需提交');
    }

    // 4. 创建标签
    tagName = `${tagPrefix}${newVersion}`;
    console.log(`\n4️⃣  创建 Git 标签 ${tagName}...`);
    if (tagExists(tagName)) {
      console.log(`  标签 ${tagName} 已存在，删除重建...`);
      execSync(`git tag -d ${tagName}`, { stdio: 'inherit' });
      execSync(`git push origin :refs/tags/${tagName}`, { stdio: 'inherit' });
    }
    execSync(`git tag ${tagName}`, { stdio: 'inherit' });
    tagCreated = true;

    // 5. 推送当前分支 + 标签
    console.log('\n5️⃣  推送到远程...');
    execSync('git push origin HEAD --tags', { stdio: 'inherit' });

    console.log(`\n✅ 发布完成！`);
    console.log(`   新版本：${tagName}`);
    console.log(`\n   TagPipeline 将自动构建并发布到 npm`);
  } catch (error) {
    console.error(`\n❌ 发布失败：${error instanceof Error ? error.message : String(error)}`);

    // 回滚版本号变更（仅回滚 package.json，保护原始工作区改动）
    console.error('\n🔄 回滚版本号变更...');
    if (originalHead) {
      try {
        // 仅检出 package.json 文件到原始版本
        execSync(`git checkout ${originalHead} -- package.json`, { stdio: 'pipe' });
        PACKAGES.forEach((pkg) => {
          execSync(`git checkout ${originalHead} -- ${pkg}/package.json`, { stdio: 'pipe' });
        });
        // 取消所有暂存
        execSync('git reset HEAD -- package.json', { stdio: 'pipe' });
        PACKAGES.forEach((pkg) => {
          try {
            execSync(`git reset HEAD -- ${pkg}/package.json`, { stdio: 'pipe' });
          } catch { /* 文件可能未被暂存，忽略 */ }
        });
        console.error('  ✓ 版本号已回滚');
      } catch {
        console.error('  ⚠ 回滚版本号失败，请手动检查 git status');
      }
    }

    // 删除远程标签（如果需要）
    if (tagCreated && tagName) {
      try {
        execSync(`git tag -d ${tagName}`, { stdio: 'pipe' });
        console.error(`  ✓ 已删除本地标签 ${tagName}`);
      } catch {
        // 标签可能不存在，忽略
      }
    }

    console.error(`\n💡 提示：如果远程已有残留更改，可执行：`);
    console.error(`   git push origin :refs/tags/${tagName || 'TAG_NAME'}`);
    console.error(`   然后人工确认远程状态。`);

    process.exit(1);
  } finally {
    // 恢复之前 stash 的未提交改动
    if (stashed) {
      try {
        console.log('\n💾 恢复暂存的工作区改动...');
        execSync('git stash pop', { stdio: 'inherit' });
        console.log('  ✓ 已恢复');
      } catch {
        console.error('  ⚠ 恢复 stash 失败，请手动执行 git stash list 检查');
      }
    }
  }
}

main();
/**
 * @fileoverview 统一版本号管理脚本
 * @description 同步更新所有包的版本号到根 package.json 的版本
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const PACKAGES = [
  'packages/base',
  'packages/cli',
  'packages/extensions/extension-ad',
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

function hasChanges(): boolean {
  try {
    execSync('git diff --quiet', { stdio: 'pipe' });
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
  
  if (!releaseType || !['patch', 'minor', 'major'].includes(releaseType)) {
    console.error('Usage: pnpm release:<type>');
    console.error('  patch  - 1.0.0 → 1.0.1 (bug fixes)');
    console.error('  minor  - 1.0.0 → 1.1.0 (new features)');
    console.error('  major  - 1.0.0 → 2.0.0 (breaking changes)');
    process.exit(1);
  }
  
  console.log(`🚀 开始发布新版本 (${releaseType})...\n`);

  let originalHead = '';
  let tagName = '';
  let tagCreated = false;

  try {
    // 保存当前 HEAD，用于失败回滚
    originalHead = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();

    // 1. 更新根版本号
    console.log('1️⃣  更新根 package.json 版本...');
    execSync(`npm version ${releaseType} --no-git-tag-version`, { stdio: 'inherit' });
    const newVersion = getCurrentVersion();
    
    // 2. 同步所有包的版本
    console.log('\n2️⃣  同步所有包的版本...');
    let hasUpdates = false;
    PACKAGES.forEach((pkg) => {
      if (updatePackageVersion(pkg, newVersion)) {
        hasUpdates = true;
      }
    });
    
    // 3. 提交更改（如果有）
    execSync('git add -A', { stdio: 'inherit' });

    if (hasUpdates || hasChanges()) {
      console.log('\n3️⃣  提交版本更新...');
      execSync(`git commit -m "chore: release v${newVersion}"`, { stdio: 'inherit' });
    } else {
      console.log('\n3️⃣  版本号已同步，无需提交');
    }
    
    // 4. 创建标签
    tagName = `v${newVersion}`;
    console.log(`\n4️⃣  创建 Git 标签 ${tagName}...`);
    if (tagExists(tagName)) {
      console.log(`  标签 ${tagName} 已存在，删除重建...`);
      execSync(`git tag -d ${tagName}`, { stdio: 'inherit' });
      execSync(`git push origin :refs/tags/${tagName}`, { stdio: 'inherit' });
    }
    execSync(`git tag ${tagName}`, { stdio: 'inherit' });
    tagCreated = true;

    // 5. 推送
    console.log('\n5️⃣  推送到远程...');
    execSync('git push origin main --tags', { stdio: 'inherit' });

    console.log(`\n✅ 发布完成！`);
    console.log(`   新版本：${tagName}`);
    console.log(`\n   TagPipeline 将自动构建并发布到 npm`);
  } catch (error) {
    console.error(`\n❌ 发布失败：${error instanceof Error ? error.message : String(error)}`);
    console.error('\n🔄 正在回滚本地更改...');

    if (originalHead) {
      try {
        execSync(`git reset --hard ${originalHead}`, { stdio: 'pipe' });
        console.error('  ✓ 已回滚文件更改到发布前状态');
      } catch {
        console.error('  ⚠ 回滚文件失败，请手动执行 git status 检查');
      }
    }

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
  }
}

main();

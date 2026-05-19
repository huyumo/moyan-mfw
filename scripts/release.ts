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

function updatePackageVersion(packagePath: string, version: string): void {
  const packageJsonPath = join(packagePath, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  
  const oldVersion = packageJson.version;
  packageJson.version = version;
  
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✓ ${packageJson.name}: ${oldVersion} → ${version}`);
}

function gitAdd(files: string[]): void {
  execSync(`git add ${files.join(' ')}`, { stdio: 'inherit' });
}

function gitCommit(message: string): void {
  execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
}

function gitTag(tag: string): void {
  execSync(`git tag ${tag}`, { stdio: 'inherit' });
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
  
  // 1. 更新根版本号
  console.log('1️⃣  更新根 package.json 版本...');
  execSync(`npm version ${releaseType} --no-git-tag-version`, { stdio: 'inherit' });
  const newVersion = getCurrentVersion();
  
  // 2. 同步所有包的版本
  console.log('\n2️⃣  同步所有包的版本...');
  PACKAGES.forEach((pkg) => updatePackageVersion(pkg, newVersion));
  
  // 3. 提交更改
  console.log('\n3️  提交版本更新...');
  const filesToUpdate = [
    'package.json',
    ...PACKAGES.map((pkg) => `${pkg}/package.json`),
  ];
  gitAdd(filesToUpdate);
  gitCommit(`chore: release v${newVersion}`);
  
  // 4. 创建标签
  console.log('\n4️⃣  创建 Git 标签...');
  gitTag(`v${newVersion}`);
  
  console.log(`\n✅ 发布完成！`);
  console.log(`   新版本：v${newVersion}`);
  console.log(`   下一步：git push origin main --tags`);
  console.log(`\n   推送 tag 后 Gitee CI 将自动构建并发布到 npm`);
}

main();

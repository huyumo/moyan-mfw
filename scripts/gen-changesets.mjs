/**
 * @fileoverview 从 conventional commits 自动预填 changeset 文件
 * @description 发版前执行：解析自上个 release tag 以来的提交记录，按
 *   feat -> minor / fix|perf -> patch / BREAKING CHANGE -> major 映射，
 *   并根据提交触达的文件路径归属到对应发布包，生成 .changeset/*.md 供人工过目。
 *
 * 用法：
 *   pnpm changesets:gen            # 对比 baseBranch（origin/main）
 *   pnpm changesets:gen <ref>      # 对比指定 ref（tag/分支/commit）
 *
 * 规则：
 * - 只统计发布包（packages/base、packages/cli、packages/extensions/extension-*）路径下的变更；
 * - 未匹配 conventional 格式的提交归为 patch；
 * - scope 无法解析时跳过并列出，人工补充；
 * - 生成 `auto-<hash>.md`，文件头部带 origin hash，同 hash 重复执行不重复生成。
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const changesetDir = path.join(rootDir, '.changeset');

// ---------------------------------------------------------------------------
// 发布包发现：动态扫描（与 check-dist.mjs / CI 保持同一来源，杜绝硬编码清单）
// ---------------------------------------------------------------------------

function discoverPublishablePackages() {
  const packages = [
    { name: 'moyan-mfw-base', dir: 'packages/base' },
    { name: 'moyan-mfw-cli', dir: 'packages/cli' },
  ];
  const extRoot = path.join(rootDir, 'packages', 'extensions');
  if (existsSync(extRoot)) {
    for (const entry of readdirSync(extRoot, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name.startsWith('extension-')) {
        // dir 用于匹配 git 输出的文件路径，必须保持 posix 风格分隔符
        const dir = `packages/extensions/${entry.name}`;
        const pkgJson = JSON.parse(readFileSync(path.join(rootDir, dir, 'package.json'), 'utf-8'));
        if (pkgJson.private !== true) {
          packages.push({ name: pkgJson.name, dir });
        }
      }
    }
  }
  return packages;
}

const packages = discoverPublishablePackages();
const dirToPackage = new Map(packages.map((p) => [p.dir, p]));

// ---------------------------------------------------------------------------
// git 提交解析
// ---------------------------------------------------------------------------

const COMMIT_RE =
  /^(?<breaking>BREAKING[ -]CHANGE:?|feat!|fix!)?(?<type>feat|feature|fix|perf|refactor|docs|style|test|chore|build|ci)(?<scopeBreaking>!)?(?:\((?<scope>[^)]+)\))?:\s*(?<subject>.+)$/i;

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf-8', cwd: rootDir, maxBuffer: 64 * 1024 * 1024 });
}

function resolveBaseRef() {
  if (process.argv[2]) return process.argv[2];
  // 找最近一个 release tag（moyan-mfw-*@*），没有则回退 baseBranch
  try {
    return sh('git rev-list --max-count=1 HEAD --grep="^chore: release"').trim() || 'origin/main';
  } catch {
    return 'origin/main';
  }
}

const baseRef = resolveBaseRef();
let commitRange;
try {
  const mergeBase = sh(`git merge-base ${baseRef} HEAD`).trim();
  commitRange = `${mergeBase}..HEAD`;
} catch {
  commitRange = `${baseRef}..HEAD`;
}

// 以 NUL 分隔读取 log，避免提交信息中的换行破坏解析
const logRaw = sh(
  `git log --no-merges --format="%x00%H%x1f%s%x1f%b%x1e" ${commitRange}`
);
const commits = logRaw
  .split('\x1e')
  .map((block) => block.trim().replace(/^\x00/, ''))
  .filter(Boolean)
  .map((block) => {
    const [hash, subject, body] = block.split('\x1f');
    return { hash, subject, body: body || '' };
  });

function classify(commit) {
  const m = commit.subject.match(COMMIT_RE);
  const breaking =
    Boolean(m?.groups?.breaking) ||
    Boolean(m?.groups?.scopeBreaking) ||
    /BREAKING[ -]CHANGE/i.test(commit.body);
  if (!m) return { level: 'patch', type: 'other', scope: null, desc: commit.subject };
  const type = m.groups.type.toLowerCase();
  const scope = m.groups.scope || null;
  const desc = m.groups.subject.trim();
  let level;
  if (breaking) level = 'major';
  else if (type === 'feat' || type === 'feature') level = 'minor';
  else if (type === 'fix' || type === 'perf' || type === 'refactor') level = 'patch';
  else return { level: null, type, scope, desc }; // docs/style/test/chore/build/ci 不发版
  return { level, type, scope, desc };
}

// 提交触达文件 -> 发布包归属
function packagesOfCommit(hash) {
  const files = sh(`git show --name-only --format= ${hash}`).split(/\r?\n/).filter(Boolean);
  const hit = new Set();
  for (const file of files) {
    // 归一化 Windows 路径分隔符
    const normalized = file.replace(/\\/g, '/');
    for (const [dir, pkg] of dirToPackage) {
      if (normalized === dir || normalized.startsWith(dir + '/')) {
        hit.add(pkg.name);
        break;
      }
    }
  }
  return [...hit];
}

// ---------------------------------------------------------------------------
// 生成 changeset 文件
// ---------------------------------------------------------------------------

mkdirSync(changesetDir, { recursive: true });
const existing = new Set(
  readdirSync(changesetDir)
    .filter((f) => f.startsWith('auto-') && f.endsWith('.md'))
    .map((f) => readFileSync(path.join(changesetDir, f), 'utf-8'))
);

// { packageName: { level, entries: [{hash, desc}] } }
const aggregated = new Map();

for (const commit of commits) {
  const { level, scope, desc } = classify(commit);
  if (!level) continue;

  let targets = packagesOfCommit(commit.hash);
  if (targets.length === 0 && scope) {
    // 文件路径未命中时尝试用 scope 匹配包名（如 feat(ledger): ...）
    const scoped = packages
      .map((p) => p.name)
      .filter((name) => name === scope || name.endsWith(scope));
    if (scoped.length === 1) targets = scoped;
  }
  // 新增整个扩展目录的提交（scope 为 extensions 等）无法按 scope 定位，
  // 回退：文件命中里出现的 extension-* 目录即视为目标包
  if (targets.length === 0) {
    const files = sh(`git show --name-only --format= ${commit.hash}`)
      .split(/\r?\n/)
      .filter(Boolean)
      .map((f) => f.replace(/\\/g, '/'));
    for (const file of files) {
      const m = file.match(/^(packages\/extensions\/extension-[^/]+)\/.*$/);
      if (m && dirToPackage.has(m[1])) {
        targets.push(dirToPackage.get(m[1]).name);
      }
    }
    targets = [...new Set(targets)];
  }

  if (targets.length === 0) {
    console.log(`  ? 跳过（无法归属）: ${commit.hash.slice(0, 8)} ${commit.subject}`);
    continue;
  }

  for (const name of targets) {
    if (!aggregated.has(name)) aggregated.set(name, { level: 'patch', entries: [] });
    const entry = aggregated.get(name);
    entry.level =
      level === 'major' ? 'major' : level === 'minor' && entry.level === 'patch' ? 'minor' : entry.level;
    entry.entries.push({ hash: commit.hash, desc });
  }
}

let generated = 0;
for (const [name, { level, entries }] of aggregated) {
  // 以全部来源 hash 汇总为文件指纹，避免重复生成
  const fingerprint = `<!-- auto-gen from: ${entries.map((e) => e.hash.slice(0, 8)).join(',')} -->`;
  if ([...existing].some((c) => c.includes(fingerprint))) {
    console.log(`  = 已存在，跳过: ${name}`);
    continue;
  }
  const lines = [
    '---',
    `"${name}": ${level}`,
    '---',
    '',
    fingerprint,
    '',
    ...entries.map((e) => `- ${e.desc} (${e.hash.slice(0, 8)})`),
    '',
  ];
  // 文件名含包名后缀，避免同一提交归属多个包时互相覆盖
  const pkgSuffix = name.replace(/^moyan-mfw(-extension)?-/, '').replace(/[^a-z0-9-]/gi, '-');
  const file = path.join(changesetDir, `auto-${entries[0].hash.slice(0, 8)}-${pkgSuffix}.md`);
  writeFileSync(file, lines.join('\n'));
  console.log(`  + ${path.relative(rootDir, file)} [${name} ${level}]`);
  generated++;
}

console.log('');
if (generated === 0) {
  console.log('没有新 changeset 生成（无发布范围提交，或均已被此前生成覆盖）。');
} else {
  console.log(`已生成 ${generated} 个 changeset，请人工过目 .changeset/ 后执行 pnpm changeset version。`);
}

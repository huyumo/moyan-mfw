#!/usr/bin/env node

/**
 * @fileoverview TASK.md 归档门禁检查脚本
 * @description 检查 .claude/TASK.md 是否还有待处理任务，如无则执行归档
 *
 * @example
 * ```bash
 * npm run gate:task-archive
 * pnpm run gate:task-archive -- --check-only
 * ```
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TASK_FILE = path.resolve(ROOT_DIR, '.claude/TASK.md');
const ARCHIVE_DIR = path.resolve(ROOT_DIR, 'docs/04-项目实施/05-任务追踪/archived');

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * 解析命令行参数
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    checkOnly: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--check-only' || args[i] === '-c') {
      config.checkOnly = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      config.help = true;
    }
  }

  return config;
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
${colors.cyan}TASK.md 归档门禁检查脚本${colors.reset}
检查 .claude/TASK.md 是否还有待处理任务，如无则执行归档

用法:
  npm run gate:task-archive [选项]

选项:
  --check-only, -c    仅检查，不执行归档
  --help, -h          显示帮助信息

示例:
  npm run gate:task-archive
  npm run gate:task-archive -- --check-only
`);
}

/**
 * 解析 YAML Front Matter
 */
function parseFrontMatter(content: string): { data: Record<string, any>; body: string } {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n/;
  const match = content.match(frontMatterRegex);

  if (!match) {
    return { data: {}, body: content };
  }

  const frontMatter = match[1];
  const body = content.slice(match[0].length);
  const data: Record<string, any> = {};

  frontMatter.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      data[key.trim()] = valueParts.join(':').trim();
    }
  });

  return { data, body };
}

/**
 * 检查 TASK.md 是否有待处理任务
 */
function hasPendingTasks(content: string): { hasInProgress: boolean; hasToStart: boolean; inProgressCount: number; toStartCount: number } {
  const lines = content.split('\n');
  let currentSection: string | null = null;
  let inProgressCount = 0;
  let toStartCount = 0;

  for (const line of lines) {
    // 检测章节标题
    if (line.startsWith('## ')) {
      currentSection = line.trim();
    }

    // 检查"进行中"章节
    if (currentSection === '## 进行中' && line.trim().startsWith('- [ ]')) {
      inProgressCount++;
    }

    // 检查"待开始"章节
    if (currentSection === '## 待开始' && line.trim().startsWith('- [ ]')) {
      toStartCount++;
    }
  }

  return {
    hasInProgress: inProgressCount > 0,
    hasToStart: toStartCount > 0,
    inProgressCount,
    toStartCount,
  };
}

/**
 * 获取最近的归档文件列表（最多 3 个）
 */
function getRecentArchives(): string[] {
  if (!fs.existsSync(ARCHIVE_DIR)) {
    return [];
  }

  const files = fs.readdirSync(ARCHIVE_DIR)
    .filter(f => f.startsWith('TASK-') && f.endsWith('.md'))
    .sort((a, b) => {
      // 按文件名排序（文件名包含日期时间，倒序排列）
      return b.localeCompare(a);
    });

  return files.slice(0, 3);
}

/**
 * 生成归档文件名
 */
function generateArchiveFileName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `TASK-${year}-${month}-${day}-${hours}${minutes}.md`;
}

/**
 * 执行归档
 */
function executeArchive(): boolean {
  try {
    // 1. 读取当前 TASK.md
    const taskContent = fs.readFileSync(TASK_FILE, 'utf-8');
    const { data: frontMatter } = parseFrontMatter(taskContent);

    // 2. 生成归档文件名
    const archiveFileName = generateArchiveFileName();
    const archiveFilePath = path.resolve(ARCHIVE_DIR, archiveFileName);

    // 3. 确保归档目录存在
    if (!fs.existsSync(ARCHIVE_DIR)) {
      fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
    }

    // 4. 写入归档文件
    fs.writeFileSync(archiveFilePath, taskContent, 'utf-8');
    console.log(`${colors.green}✓${colors.reset} 已创建归档文件：${archiveFileName}`);

    // 5. 生成新的 TASK.md
    const recentArchives = getRecentArchives();
    const archiveLinks = recentArchives
      .map(f => `> - [归档文件](../../../docs/04-项目实施/05-任务追踪/archived/${f})`)
      .join('\n');

    const now = new Date();
    const timestamp = now.getTime();
    const dateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newTaskContent = `---
task: 等待新任务输入
status: pending
priority: P1
started: ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}
updated: ${dateTime}
session: session-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}00
lock: ${timestamp}
assignee: @dev
---

## 当前目标
等待新任务输入

## 已完成
> 上期任务周期已完成任务详见历史归档：
${archiveLinks}

## 进行中
- [ ] 无

## 待开始
- [ ] 无

## 相关文件
${recentArchives.map(f => `- [历史归档](../../../docs/04-项目实施/05-任务追踪/archived/${f})`).join('\n')}

## 变更记录
| 时间 | 变更类型 | 变更内容 | 原因 |
|------|----------|----------|------|
| ${dateTime} | 归档重置 | TASK.md 归档并重置 | 所有任务已完成 |
`;

    fs.writeFileSync(TASK_FILE, newTaskContent, 'utf-8');
    console.log(`${colors.green}✓${colors.reset} 已重置 .claude/TASK.md`);
    console.log(`${colors.green}✓${colors.reset} 保留最近 ${recentArchives.length} 条归档链接`);

    return true;
  } catch (err) {
    console.error(`${colors.red}[ERROR]${colors.reset} 归档失败：${err.message}`);
    return false;
  }
}

/**
 * 主函数
 */
function main() {
  const config = parseArgs();

  if (config.help) {
    showHelp();
    process.exit(0);
  }

  console.log(`${colors.cyan}TASK.md 归档门禁检查${colors.reset}`);
  console.log('检查是否还有待处理任务...\n');

  // 检查 TASK.md 是否存在
  if (!fs.existsSync(TASK_FILE)) {
    console.log(`${colors.yellow}[WARNING]${colors.reset} .claude/TASK.md 不存在`);
    process.exit(0);
  }

  const taskContent = fs.readFileSync(TASK_FILE, 'utf-8');
  const taskStatus = hasPendingTasks(taskContent);

  console.log(`进行中任务：${taskStatus.inProgressCount} 个`);
  console.log(`待开始任务：${taskStatus.toStartCount} 个`);

  if (taskStatus.hasInProgress || taskStatus.hasToStart) {
    console.log(`\n${colors.green}✓${colors.reset} 有待处理任务，无需归档`);
    process.exit(0);
  }

  console.log(`\n${colors.yellow}!${colors.reset} 所有任务已完成，需要执行归档`);

  if (config.checkOnly) {
    console.log(`${colors.cyan}[CHECK ONLY]${colors.reset} 跳过归档执行`);
    process.exit(0);
  }

  // 执行归档
  const success = executeArchive();

  if (success) {
    console.log(`\n${colors.green}✅ 归档完成！${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}❌ 归档失败，请检查错误信息${colors.reset}`);
    process.exit(1);
  }
}

main();

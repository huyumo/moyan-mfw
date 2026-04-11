/**
 * 活跃任务追踪工具
 *
 * 用途：追踪和管理团队中的活跃任务
 *
 * 使用方式：
 *   npx tsx scripts/track-active-tasks.ts          # 查看当前活跃任务
 *   npx tsx scripts/track-active-tasks.ts --user 张三   # 查看特定用户的任务
 */

import * as fs from 'fs';
import * as path from 'path';

interface ActiveTask {
  file: string;
  task: string;
  assignee: string;
  status: string;
  priority: string;
  updated: string;
}

function findProjectRoot(): string {
  let currentDir = process.cwd();
  const maxDepth = 5;
  let depth = 0;

  while (depth < maxDepth) {
    if (fs.existsSync(path.join(currentDir, 'TASK.md'))) {
      return currentDir;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
    depth++;
  }

  return process.cwd();
}

function parseFrontMatter(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      result[match[1]] = match[2].trim();
    }
  }

  return result;
}

function findTaskFiles(dir: string): string[] {
  const taskFiles: string[] = [];

  // 查找根目录的 TASK.md
  const rootTask = path.join(dir, 'TASK.md');
  if (fs.existsSync(rootTask)) {
    taskFiles.push(rootTask);
  }

  // 查找归档目录
  const archiveDir = path.join(dir, '.claude', 'archive', 'tasks');
  if (fs.existsSync(archiveDir)) {
    const files = fs.readdirSync(archiveDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        taskFiles.push(path.join(archiveDir, file));
      }
    }
  }

  return taskFiles;
}

function getActiveTasks(projectRoot: string, filterUser?: string): ActiveTask[] {
  const taskFiles = findTaskFiles(projectRoot);
  const activeTasks: ActiveTask[] = [];

  for (const file of taskFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const frontMatter = parseFrontMatter(content);

    if (frontMatter.status === 'in_progress' || frontMatter.status === 'blocked') {
      if (!filterUser || frontMatter.assignee === filterUser) {
        activeTasks.push({
          file: path.relative(projectRoot, file),
          task: frontMatter.task || '未知任务',
          assignee: frontMatter.assignee || '未分配',
          status: frontMatter.status,
          priority: frontMatter.priority || 'P3',
          updated: frontMatter.updated || '未知'
        });
      }
    }
  }

  return activeTasks;
}

function printActiveTasks(tasks: ActiveTask[]) {
  console.log('\n=== 活跃任务列表 ===\n');

  if (tasks.length === 0) {
    console.log('暂无活跃任务\n');
    return;
  }

  // 按 assignee 分组
  const byAssignee = new Map<string, ActiveTask[]>();
  for (const task of tasks) {
    const assignee = task.assignee;
    if (!byAssignee.has(assignee)) {
      byAssignee.set(assignee, []);
    }
    byAssignee.get(assignee)!.push(task);
  }

  for (const [assignee, assigneeTasks] of byAssignee.entries()) {
    console.log(`\n📋 ${assignee} (${assigneeTasks.length} 个任务)`);
    console.log('─'.repeat(50));

    for (const task of assigneeTasks) {
      const statusIcon = task.status === 'in_progress' ? '🟢' : '🔴';
      console.log(`${statusIcon} [${task.priority}] ${task.task}`);
      console.log(`   状态：${task.status} | 更新：${task.updated}`);
      console.log(`   文件：${task.file}\n`);
    }
  }

  console.log(`\n总计：${tasks.length} 个活跃任务\n`);
}

// CLI 入口
const args = process.argv.slice(2);
const projectRoot = findProjectRoot();

// 解析 --user 参数
let filterUser: string | undefined;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--user' && args[i + 1]) {
    filterUser = args[i + 1];
    i++;
  }
}

const activeTasks = getActiveTasks(projectRoot, filterUser);
printActiveTasks(activeTasks);

// 输出 JSON（用于其他脚本）
if (args.includes('--json')) {
  console.log('\n--- JSON Output ---\n');
  console.log(JSON.stringify(activeTasks, null, 2));
}

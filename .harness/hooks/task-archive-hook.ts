/**
 * 任务自动归档 Hook
 *
 * 目的：当 TASK.md 状态变更为 completed 时，自动归档任务到 registry
 *
 * 触发时机：PostToolUse (Write/Edit TASK.md)
 *
 * 全自动：无需用户确认，自动检测、自动归档、自动登记
 */

import * as fs from 'fs';
import * as path from 'path';

interface TaskMeta {
  task: string;
  status: string;
  priority: string;
  started: string;
  updated: string;
  session: string;
  assignee?: string;
  reviewers?: string[];
}

interface Registry {
  version: string;
  description: string;
  lastUpdated: string;
  tasks: Array<{
    seq: number;
    title: string;
    category: string;
    categoryName: string;
    status: string;
    assignee?: string;
    started: string;
    completed: string | null;
    session: string;
    tags: string[];
    reportPath?: string;
  }>;
  statistics: {
    total: number;
    completed: number;
    inProgress: number;
    byCategory: Record<string, number>;
  };
}

interface TaskState {
  currentTask: {
    title: string;
    status: string;
    completedAt: string | null;
    archived: boolean;
  };
  lastUpdated: string;
  sessionHistory: Array<{
    session: string;
    task: string;
    timestamp: string;
  }>;
}

/**
 * 向上查找项目根目录
 */
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

/**
 * 解析 YAML Front Matter
 */
function parseFrontMatter(content: string): TaskMeta {
  const result: Record<string, string> = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      result[match[1]] = match[2].trim();
    }
  }

  return result as unknown as TaskMeta;
}

/**
 * 加载任务注册表
 */
function loadRegistry(projectRoot: string): Registry {
  const registryPath = path.join(projectRoot, '.harness', 'registry', 'tasks.json');
  if (!fs.existsSync(registryPath)) {
    return createEmptyRegistry();
  }
  return JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
}

/**
 * 创建空注册表
 */
function createEmptyRegistry(): Registry {
  return {
    version: '1.0',
    description: '项目任务历史总表',
    lastUpdated: new Date().toISOString(),
    tasks: [],
    statistics: {
      total: 0,
      completed: 0,
      inProgress: 0,
      byCategory: {}
    }
  };
}

/**
 * 保存注册表
 */
function saveRegistry(projectRoot: string, registry: Registry): void {
  const registryPath = path.join(projectRoot, '.harness', 'registry', 'tasks.json');
  registry.lastUpdated = new Date().toISOString();
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
}

/**
 * 加载任务状态
 */
function loadTaskState(projectRoot: string): TaskState | null {
  const statePath = path.join(projectRoot, '.harness', 'state', 'last-task-state.json');
  if (!fs.existsSync(statePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
}

/**
 * 保存任务状态
 */
function saveTaskState(projectRoot: string, state: TaskState): void {
  const statePath = path.join(projectRoot, '.harness', 'state', 'last-task-state.json');
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * 任务标题归一化（用于去重比较）
 */
function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '');
}

/**
 * 检测任务是否已归档
 */
function taskAlreadyArchived(registry: Registry, title: string, completed: string): boolean {
  const normalized = normalizeTitle(title);
  return registry.tasks.some(t =>
    normalizeTitle(t.title) === normalized && t.completed === completed
  );
}

/**
 * 自动分类任务
 */
function categorizeTask(title: string): { id: string; name: string } {
  const categoriesPath = path.join(findProjectRoot(), '.harness', 'registry', 'categories.json');
  let categories = [];

  if (fs.existsSync(categoriesPath)) {
    const config = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));
    categories = config.categories || [];
  }

  // 默认分类
  const defaultCategory = { id: 'feature-dev', name: '功能开发' };

  if (categories.length === 0) {
    return defaultCategory;
  }

  // 关键词匹配
  const titleLower = title.toLowerCase();
  for (const cat of categories) {
    if (cat.keywords && Array.isArray(cat.keywords)) {
      for (const keyword of cat.keywords) {
        if (titleLower.includes(keyword.toLowerCase())) {
          return { id: cat.id, name: cat.name };
        }
      }
    }
  }

  return defaultCategory;
}

/**
 * 生成任务标签
 */
function generateTags(title: string, category: string): string[] {
  const tags = new Set<string>();

  // 添加分类标签
  tags.add(category);

  // 从标题提取关键词
  const keywords = ['harness', '摸底测试', '配置', '前端', '后端', '文档', '测试', '修复', '重构'];
  for (const kw of keywords) {
    if (title.toLowerCase().includes(kw.toLowerCase())) {
      tags.add(kw);
    }
  }

  return Array.from(tags);
}

/**
 * 查找任务的报告文件
 */
function findReportPath(projectRoot: string, taskTitle: string): string | undefined {
  const docsDir = path.join(projectRoot, '.harness', 'docs');
  if (!fs.existsSync(docsDir)) {
    return undefined;
  }

  const files = fs.readdirSync(docsDir);
  const normalizedTitle = normalizeTitle(taskTitle);

  // 尝试匹配报告文件名
  for (const file of files) {
    if (file.endsWith('.md')) {
      const normalizedFile = normalizeTitle(file.replace('.md', ''));
      // 检查文件名是否包含任务标题的关键词
      if (normalizedFile.includes(normalizedTitle.slice(0, 20))) {
        return `.harness/docs/${file}`;
      }
    }
  }

  return undefined;
}

/**
 * 主函数
 */
export async function run(args: string[]): Promise<{
  passed: boolean;
  message: string;
  warnings: string[];
  errors: string[];
  data?: {
    action: 'archived' | 'updated' | 'skipped' | 'initialized';
    taskTitle?: string;
    reason?: string;
  };
}> {
  const result = {
    passed: true,
    message: '',
    warnings: [] as string[],
    errors: [] as string[],
    data: undefined as any
  };

  const projectRoot = findProjectRoot();
  const taskFilePath = path.join(projectRoot, 'TASK.md');

  // 检查 TASK.md 是否存在
  if (!fs.existsSync(taskFilePath)) {
    result.data = { action: 'skipped', reason: 'TASK.md 不存在' };
    result.message = '⚠️ 任务归档跳过 - TASK.md 不存在';
    return result;
  }

  // 读取并解析 TASK.md
  const content = fs.readFileSync(taskFilePath, 'utf-8');
  const frontMatter = parseFrontMatter(content);

  // 验证必填字段
  if (!frontMatter.task || !frontMatter.status) {
    result.data = { action: 'skipped', reason: 'TASK.md 缺少必填字段' };
    result.message = '⚠️ 任务归档跳过 - TASK.md 格式不完整';
    return result;
  }

  // 加载当前状态和注册表
  const lastState = loadTaskState(projectRoot);
  const registry = loadRegistry(projectRoot);

  // 检测状态变更
  const statusChanged = lastState?.currentTask?.status !== frontMatter.status;
  const justCompleted = statusChanged && frontMatter.status === 'completed';

  // 检测是否已完成但未归档
  const completedButNotArchived =
    frontMatter.status === 'completed' &&
    !lastState?.currentTask?.archived;

  // 核心判断：是否需要归档
  const needsArchive = justCompleted || completedButNotArchived;

  if (needsArchive) {
    // 检查是否已归档（避免重复）
    if (taskAlreadyArchived(registry, frontMatter.task, frontMatter.updated)) {
      result.data = { action: 'skipped', reason: '任务已归档', taskTitle: frontMatter.task };
      result.message = `⚠️ 任务 "${frontMatter.task}" 已归档，跳过`;

      // 更新状态标记为已归档
      saveTaskState(projectRoot, {
        currentTask: {
          title: frontMatter.task,
          status: frontMatter.status,
          completedAt: frontMatter.updated,
          archived: true
        },
        lastUpdated: new Date().toISOString(),
        sessionHistory: lastState?.sessionHistory || []
      });

      return result;
    }

    // 执行归档
    const category = categorizeTask(frontMatter.task);
    const tags = generateTags(frontMatter.task, category.id);
    const reportPath = findReportPath(projectRoot, frontMatter.task);

    // 计算下一个序号
    const nextSeq = registry.tasks.length > 0
      ? Math.max(...registry.tasks.map(t => t.seq)) + 1
      : 1;

    // 添加任务到注册表
    registry.tasks.push({
      seq: nextSeq,
      title: frontMatter.task,
      category: category.id,
      categoryName: category.name,
      status: 'completed',
      assignee: frontMatter.assignee,
      started: frontMatter.started.split('T')[0],
      completed: frontMatter.updated.split('T')[0],
      session: frontMatter.session,
      tags,
      reportPath
    });

    // 更新统计
    registry.statistics.total = registry.tasks.length;
    registry.statistics.completed = registry.tasks.filter(t => t.status === 'completed').length;
    registry.statistics.inProgress = registry.tasks.filter(t => t.status === 'in_progress').length;

    // 按分类统计
    registry.tasks.forEach(t => {
      if (!registry.statistics.byCategory[t.category]) {
        registry.statistics.byCategory[t.category] = 0;
      }
      registry.statistics.byCategory[t.category]++;
    });

    // 保存注册表
    saveRegistry(projectRoot, registry);

    // 更新状态
    saveTaskState(projectRoot, {
      currentTask: {
        title: frontMatter.task,
        status: frontMatter.status,
        completedAt: frontMatter.updated,
        archived: true
      },
      lastUpdated: new Date().toISOString(),
      sessionHistory: lastState?.sessionHistory || []
    });

    result.data = {
      action: justCompleted ? 'archived' : 'updated',
      taskTitle: frontMatter.task,
      reason: justCompleted ? '任务完成' : '补归档'
    };
    result.message = `✅ 任务已归档：${frontMatter.task}`;
  } else {
    // 不需要归档，更新状态跟踪
    saveTaskState(projectRoot, {
      currentTask: {
        title: frontMatter.task,
        status: frontMatter.status,
        completedAt: frontMatter.status === 'completed' ? frontMatter.updated : null,
        archived: lastState?.currentTask?.archived || false
      },
      lastUpdated: new Date().toISOString(),
      sessionHistory: lastState?.sessionHistory || []
    });

    result.data = { action: 'skipped', reason: '任务未完成', taskTitle: frontMatter.task };
    result.message = `⏭️ 任务 "${frontMatter.task}" 未完成，暂不归档`;
  }

  return result;
}

// CLI 入口
const isMain = require.main === module;

if (isMain) {
  run(process.argv.slice(2))
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.passed ? 0 : 1);
    })
    .catch(error => {
      console.error(JSON.stringify({
        passed: false,
        message: `钩子执行失败：${error.message}`,
        errors: [error.message],
        warnings: []
      }, null, 2));
      process.exit(1);
    });
}

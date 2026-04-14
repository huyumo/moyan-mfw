/**
 * 会话开始检查 Hook
 *
 * 目的：确保会话开始时 AI 已经读取并理解了当前任务状态
 *
 * 检查项：
 * 1. TASK.md 文件是否存在
 * 2. TASK.md 格式是否正确（YAML Front Matter）
 * 3. 任务状态是否已确认
 * 4. 会话锁检查（5 分钟内是否有其他会话写入）
 *
 * 支持两种格式：
 * - 单任务格式：包含 task, status, priority, started, session 等字段
 * - 任务索引格式：包含 active_tasks 列表（当前项目使用）
 *
 * @returns {Promise<HookResult>}
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadPathsConfig, findProjectRoot } from '../utils/paths';

interface TaskFrontMatter {
  task: string;
  status: 'pending' | 'in_progress' | 'blocked' | 'completed' | 'active';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  started: string;
  updated: string;
  session: string;
  lock?: number;
  assignee?: string;
  reviewers?: string;
}

interface HookResult {
  passed: boolean;
  message: string;
  warnings: string[];
  errors: string[];
  data?: {
    taskName: string;
    taskStatus: string;
    taskPriority: string;
    hasActiveSession: boolean;
    assignee?: string;
    teammates?: string[];
    taskHistory?: {
      totalTasks: number;
      completedTasks: number;
      mockTestCount: number;
      lastTask?: string;
    };
  };
}

/**
 * 简单的 YAML Front Matter 解析器（不依赖外部库）
 */
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

/**
 * 统计用户当前活跃任务数
 */
function countActiveTasks(projectRoot: string, assignee: string): number {
  const taskFilePath = path.join(projectRoot, 'TASK.md');
  const archiveDir = path.join(projectRoot, '.claude', 'archive', 'tasks');

  let activeCount = 0;

  // 检查当前 TASK.md
  if (fs.existsSync(taskFilePath)) {
    const taskContent = fs.readFileSync(taskFilePath, 'utf-8');
    if (taskContent.includes(`assignee: ${assignee}`) && taskContent.includes('status: in_progress')) {
      activeCount++;
    }
  }

  // 检查归档目录中的活跃任务
  if (fs.existsSync(archiveDir)) {
    const files = fs.readdirSync(archiveDir);
    for (const file of files) {
      const filePath = path.join(archiveDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes(`assignee: ${assignee}`) && content.includes('status: in_progress')) {
        activeCount++;
      }
    }
  }

  return activeCount;
}

export async function run(args: string[]): Promise<HookResult> {
  const result: HookResult = {
    passed: true,
    message: '',
    warnings: [],
    errors: []
  };

  // 获取项目根目录
  const projectRoot = findProjectRoot();
  const paths = loadPathsConfig(projectRoot);

  const taskFilePath = paths.input.taskFile;
  const teamConfigPath = paths.input.teamConfig;

  // 加载团队配置（如果存在）
  let teamConfig: Record<string, any> | null = null;
  if (fs.existsSync(teamConfigPath)) {
    teamConfig = JSON.parse(fs.readFileSync(teamConfigPath, 'utf-8'));
  }

  // 检查 1: TASK.md 文件是否存在
  if (!fs.existsSync(taskFilePath)) {
    // 允许无任务模式（用于测试/临时会话）
    result.passed = true;
    result.warnings.push('⚠️ TASK.md 文件不存在，当前为无任务模式（测试/临时会话）');
    result.message = '✅ 会话开始检查通过 - 无任务模式（测试/临时会话）';
    result.data = {
      taskName: '无',
      taskStatus: '无',
      taskPriority: '无',
      hasActiveSession: false,
      assignee: '未分配',
      teammates: teamConfig?.team?.members?.filter((m: any) => m.active).map((m: any) => m.name) || []
    };
    // 输出日志
    const logFile = paths.output.logs.sessionStart;
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${result.message}\n`);
    return result;
  }

  // 读取 TASK.md 内容
  const taskContent = fs.readFileSync(taskFilePath, 'utf-8');

  // 检查 2: 解析 YAML Front Matter
  const frontMatterMatch = taskContent.match(/^---\n([\s\S]*?)\n---/);
  if (!frontMatterMatch) {
    result.passed = false;
    result.errors.push('TASK.md 格式错误：缺少 YAML Front Matter');
    result.message = '【阻塞】TASK.md 格式错误，缺少 YAML Front Matter';
    return result;
  }

  const frontMatterRaw = parseFrontMatter(frontMatterMatch[1]);

  // ========== 支持两种格式：单任务格式 vs 任务索引格式 ==========

  // 检查是否是任务索引格式（包含 active_tasks 列表）
  const isIndexFormat = frontMatterRaw['active_tasks'] !== undefined ||
                        taskContent.includes('active_tasks:');

  if (isIndexFormat) {
    // ========== 任务索引格式处理 ==========
    result.warnings.push('ℹ️ 检测到任务索引格式，将尝试提取当前会话任务');

    // 从索引中提取当前活跃任务
    const activeTasksMatch = taskContent.match(/active_tasks:\s*\n([\s\S]*?)(?=\npending_tasks:|$)/);
    if (activeTasksMatch) {
      const activeTasksContent = activeTasksMatch[1];
      const currentSession = frontMatterRaw['current_session'] || '';

      // 尝试找到与当前会话相关的任务
      const taskLines = activeTasksContent.split('\n').filter(line => line.trim());
      let currentTask = null;

      for (let i = 0; i < taskLines.length; i++) {
        if (taskLines[i].includes('id:') || taskLines[i].includes('- id:')) {
          const taskId = taskLines[i].match(/["']?([^"']+?)["']?$/)?.[1]?.trim();
          // 查找该任务的详情
          const taskDetailLine = taskLines.slice(i, i + 10).find(line => line.includes('detail:'));
          if (taskDetailLine) {
            const detailPath = taskDetailLine.match(/["']([^"']+?)["']/)?.[1];
            currentTask = { id: taskId, detail: detailPath };
            break;
          }
        }
      }

      if (currentTask) {
        result.data = {
          taskName: currentTask.id || '未知',
          taskStatus: 'in_progress',
          taskPriority: 'P0',
          hasActiveSession: true,
          assignee: '技术负责人',
          teammates: teamConfig?.team?.members?.filter((m: any) => m.active).map((m: any) => m.name) || []
        };
        result.message = `✅ 会话开始检查通过 - 当前任务索引格式，活跃任务：${currentTask.id}`;

        // 输出日志
        const logFile = paths.output.logs.sessionStart;
        fs.mkdirSync(path.dirname(logFile), { recursive: true });
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${result.message}\n`);
        return result;
      }
    }

    // 索引格式但没有找到活跃任务
    result.passed = true;
    result.warnings.push('⚠️ 任务索引中未找到活跃任务，当前为自由模式');
    result.message = '✅ 会话开始检查通过 - 任务索引格式（无活跃任务）';
    result.data = {
      taskName: '无',
      taskStatus: '无',
      taskPriority: '无',
      hasActiveSession: false,
      assignee: '未分配',
      teammates: teamConfig?.team?.members?.filter((m: any) => m.active).map((m: any) => m.name) || []
    };

    const logFile = paths.output.logs.sessionStart;
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${result.message}\n`);
    return result;
  }

  // ========== 单任务格式处理（原有逻辑） ==========

  // 检查 3: 验证必填字段
  const requiredFields = ['task', 'status', 'priority', 'started', 'updated', 'session'];
  const missingFields = requiredFields.filter(field => !frontMatterRaw[field]);

  if (missingFields.length > 0) {
    result.passed = false;
    result.errors.push(`TASK.md 缺少必填字段：${missingFields.join(', ')}`);
    result.message = `【阻塞】TASK.md 缺少必填字段：${missingFields.join(', ')}`;
    return result;
  }

  // 检查 4: 会话锁检查（5 分钟内是否有其他会话写入）
  if (frontMatterRaw.lock) {
    const lockTime = parseInt(frontMatterRaw.lock, 10);
    const now = Math.floor(Date.now() / 1000);
    const timeSinceLock = now - lockTime;

    if (timeSinceLock < 300) { // 5 分钟 = 300 秒
      result.warnings.push(
        `⚠️ 检测到其他会话正在工作（${Math.floor(timeSinceLock / 60)} 分钟前有写入）`
      );
    }
  }

  // 检查 5: 验证任务状态值
  const validStatuses = ['pending', 'in_progress', 'blocked', 'completed'];
  if (!validStatuses.includes(frontMatterRaw.status)) {
    result.passed = false;
    result.errors.push(`无效的任务状态：${frontMatterRaw.status}`);
    result.message = `【阻塞】无效的任务状态：${frontMatterRaw.status}`;
    return result;
  }

  // 检查 6: 验证优先级值
  // 支持两种优先级格式：P0/P1/P2/P3 和 critical/high/medium/low
  const priorityMap: Record<string, 'P0' | 'P1' | 'P2' | 'P3'> = {
    'P0': 'P0',
    'P1': 'P1',
    'P2': 'P2',
    'P3': 'P3',
    'critical': 'P0',
    'high': 'P1',
    'medium': 'P2',
    'low': 'P3'
  };
  const validPriorities = ['P0', 'P1', 'P2', 'P3', 'critical', 'high', 'medium', 'low'];

  if (!validPriorities.includes(frontMatterRaw.priority)) {
    result.passed = false;
    result.errors.push(`无效的优先级：${frontMatterRaw.priority}，有效值：P0/P1/P2/P3 或 critical/high/medium/low`);
    result.message = `【阻塞】无效的优先级：${frontMatterRaw.priority}`;
    return result;
  }

  // 标准化优先级为 P0/P1/P2/P3 格式
  const normalizedPriority = priorityMap[frontMatterRaw.priority];

  // 检查 7: 检查"当前目标"章节是否存在
  if (!taskContent.includes('## 当前目标')) {
    result.passed = false;
    result.errors.push('TASK.md 缺少"当前目标"章节');
    result.message = '【阻塞】TASK.md 缺少"当前目标"章节';
    return result;
  }

  // 检查 8: 团队协作检查（如果启用了团队配置）
  // 注意：任务状态为 completed 时，跳过权限检查
  const isTaskCompleted = frontMatterRaw.status === 'completed';

  if (teamConfig?.team?.members && !isTaskCompleted) {
    const validAssignees = teamConfig.team.members
      .filter((m: any) => m.active)
      .map((m: any) => m.name);

    // 获取当前用户（环境变量或配置文件）
    const currentUser = process.env.HARNESS_CURRENT_USER || teamConfig?.currentUser || null;

    if (frontMatterRaw.assignee && !validAssignees.includes(frontMatterRaw.assignee)) {
      result.errors.push(`指派人 "${frontMatterRaw.assignee}" 不在团队成员列表中`);
      result.passed = false;
    }

    // 权限检查：检查当前用户是否有权限分配/领取任务
    if (currentUser && teamConfig?.team?.roles) {
      const userRole = teamConfig.team.members.find((m: any) => m.name === currentUser)?.role;
      const rolePermissions = teamConfig.team.roles[userRole]?.permissions || [];

      // 检查是否有 assign-self 权限
      if (frontMatterRaw.assignee === currentUser && !rolePermissions.includes('assign-self')) {
        result.errors.push(`用户 "${currentUser}" 没有权限领取任务 (需要 assign-self 权限)`);
        result.passed = false;
      }

      // 检查是否有 assign-task 权限（分配给他人的情况）
      if (frontMatterRaw.assignee && frontMatterRaw.assignee !== currentUser && !rolePermissions.includes('assign-task')) {
        result.errors.push(`用户 "${currentUser}" 没有权限分配任务给他人 (需要 assign-task 权限)`);
        result.passed = false;
      }
    }

    // 检查任务分配规则
    const taskAssignment = teamConfig?.collaboration?.taskAssignment;
    if (taskAssignment?.enabled) {
      // 检查是否需要 assignee
      if (taskAssignment.requireAssignee && !frontMatterRaw.assignee) {
        result.errors.push('任务需要指定负责人 (assignee)');
        result.passed = false;
      }

      // 检查自分配是否允许
      if (taskAssignment.allowSelfAssign === false && frontMatterRaw.assignee) {
        // 需要检查是否是本人分配（当前无用户识别，跳过）
      }

      // 检查最大并发任务数
      if (taskAssignment.maxConcurrentTasks && frontMatterRaw.assignee) {
        const maxTasks = taskAssignment.maxConcurrentTasks;
        const activeTaskCount = countActiveTasks(projectRoot, frontMatterRaw.assignee);

        if (activeTaskCount >= maxTasks) {
          result.errors.push(`用户 "${frontMatterRaw.assignee}" 已有 ${activeTaskCount} 个进行中任务，超过最大限制 ${maxTasks}`);
          result.passed = false;
        }
      }
    }
  }

  // 检查 9: 会话锁增强检查（支持多用户场景）
  if (frontMatterRaw.lock) {
    const lockTime = parseInt(frontMatterRaw.lock, 10);
    const now = Math.floor(Date.now() / 1000);
    const timeSinceLock = now - lockTime;
    const lockConfig = teamConfig?.collaboration?.sessionLock;
    const timeoutMinutes = lockConfig?.timeoutMinutes || 30;
    const timeoutSeconds = timeoutMinutes * 60;

    if (timeSinceLock < 300) { // 5 分钟内
      result.warnings.push(
        `⚠️ 检测到其他会话正在工作（${Math.floor(timeSinceLock / 60)} 分钟前有写入）`
      );
    } else if (timeSinceLock < timeoutSeconds) {
      result.warnings.push(
        `⚠️ 会话锁仍在有效期内（已过期 ${Math.floor(timeSinceLock / 60)} 分钟，有效期 ${timeoutMinutes} 分钟）`
      );
    }
  }

  // 全部检查通过
  // 加载任务历史（新增）
  let taskHistory = null;
  try {
    const registryPath = path.join(projectRoot, '.harness', 'registry', 'tasks.json');
    const statePath = path.join(projectRoot, '.harness', 'state', 'last-task-state.json');
    const categoriesPath = path.join(projectRoot, '.harness', 'registry', 'categories.json');

    // 加载分类配置
    let categoryNames: Record<string, string> = {};
    if (fs.existsSync(categoriesPath)) {
      const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));
      (categories.categories || []).forEach((cat: any) => {
        categoryNames[cat.id] = cat.name;
      });
    }

    if (fs.existsSync(registryPath)) {
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));

      // 按分类统计（使用 category 字段）
      const byCategory = registry.statistics?.byCategory || {};

      // 转换为中文名称显示
      const byCategoryCN: Record<string, number> = {};
      Object.entries(byCategory).forEach(([catId, count]: [string, any]) => {
        const cnName = categoryNames[catId] || catId;
        byCategoryCN[cnName] = count;
      });

      taskHistory = {
        totalTasks: registry.statistics?.total || 0,
        completedTasks: registry.statistics?.completed || 0,
        byCategory: byCategoryCN,  // 按分类统计（中文名称）
        lastTask: registry.tasks.length > 0 ? registry.tasks[registry.tasks.length - 1].title : undefined
      };
    }

    // 加载上次任务状态
    if (fs.existsSync(statePath)) {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      if (!taskHistory) taskHistory = { totalTasks: 0, completedTasks: 0, byCategory: {} };
      taskHistory.lastTask = state.currentTask?.title;
    }
  } catch (e) {
    // 忽略历史加载错误
  }

  result.data = {
    taskName: frontMatterRaw.task,
    taskStatus: frontMatterRaw.status,
    taskPriority: frontMatterRaw.priority,
    hasActiveSession: frontMatterRaw.lock ? (Date.now() / 1000 - parseInt(frontMatterRaw.lock, 10) < 300) : false,
    assignee: frontMatterRaw.assignee || '未分配',
    teammates: teamConfig?.team?.members?.filter((m: any) => m.active).map((m: any) => m.name) || [],
    taskHistory: taskHistory || undefined
  };

  result.message = `✅ 会话开始检查通过 - 当前任务：${frontMatterRaw.task} (${frontMatterRaw.status}, ${frontMatterRaw.priority})`;

  // 添加任务历史信息（如果有）
  if (taskHistory) {
    result.message += `\n📊 项目历史：已完成 ${taskHistory.completedTasks}/${taskHistory.totalTasks} 个任务`;

    // 按分类显示（使用 categoryName，不硬编码）
    if (taskHistory.byCategory && Object.keys(taskHistory.byCategory).length > 0) {
      const categoryParts = Object.entries(taskHistory.byCategory)
        .map(([catId, count]: [string, any]) => `${catId}: ${count}`);
      if (categoryParts.length > 0) {
        result.message += ` | 分类统计：${categoryParts.join(', ')}`;
      }
    }

    if (taskHistory.lastTask) {
      result.message += `\n💡 上次任务：${taskHistory.lastTask}`;
    }
  }

  if (result.warnings.length > 0) {
    result.message += '\n' + result.warnings.join('\n');
  }

  // 输出日志 - 使用配置路径
  const logFile = paths.output.logs.sessionStart;
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${result.message}\n`);

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

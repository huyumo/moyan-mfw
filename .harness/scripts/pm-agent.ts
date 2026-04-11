/**
 * PM Agent - 项目负责人智能体
 *
 * 职责：
 * 1. 需求分析 - 与用户沟通确认需求和实现方案
 * 2. 任务分解 - 将大任务拆解为可执行的小任务
 * 3. 任务分配 - 根据技能自动分配给 Dev-Agent 或 QA-Agent
 * 4. 进度管理 - 追踪任务状态，协调阻塞问题
 * 5. 质量把关 - 确认 QA 审查通过，批准合并
 * 6. 交付确认 - 最终交付前与用户确认
 *
 * 特点：
 * - 不参与编码工作
 * - 自主决策任务分配
 * - 管理整个开发流程
 *
 * @returns {Promise<PMResult>}
 */

import * as fs from 'fs';
import * as path from 'path';

interface PMResult {
  passed: boolean;
  message: string;
  warnings: string[];
  errors: string[];
  data?: {
    pmAgentActive: boolean;
    currentPhase: string;
    assignedTasks: Array<{
      taskId: string;
      assignee: string;
      status: string;
    }>;
    blockedTasks: Array<{
      taskId: string;
      reason: string;
      needsUserInput: boolean;
    }>;
    nextActions: string[];
  };
}

interface Task {
  id: string;
  title: string;
  assignee?: string;
  status: 'pending' | 'in_progress' | 'blocked' | 'completed';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  phase?: 'requirement' | 'design' | 'development' | 'review' | 'delivery';
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
 * 解析 TASK.md 中的任务列表
 */
function parseTasks(content: string): Task[] {
  const tasks: Task[] = [];
  const lines = content.split('\n');
  let currentSection = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测章节
    if (line.startsWith('## ')) {
      currentSection = line.replace('## ', '').trim();
      continue;
    }

    // 检测任务项
    const taskMatch = line.match(/^- \[([ x])\] (.+)$/);
    if (taskMatch && ['进行中', '待开始', '已完成'].includes(currentSection)) {
      const checked = taskMatch[1] === 'x';
      tasks.push({
        id: `task-${tasks.length + 1}`,
        title: taskMatch[2],
        status: checked ? 'completed' : 'in_progress',
        priority: 'P2'
      });
    }
  }

  return tasks;
}

/**
 * 加载团队配置
 */
function loadTeamConfig(projectRoot: string): Record<string, any> | null {
  const teamConfigPath = path.join(projectRoot, '.claude', 'harness', 'team.json');
  if (fs.existsSync(teamConfigPath)) {
    return JSON.parse(fs.readFileSync(teamConfigPath, 'utf-8'));
  }
  return null;
}

/**
 * PM Agent 主逻辑
 */
export async function run(args: string[]): Promise<PMResult> {
  const result: PMResult = {
    passed: true,
    message: '',
    warnings: [],
    errors: []
  };

  const projectRoot = findProjectRoot();
  const teamConfig = loadTeamConfig(projectRoot);
  const outputDir = path.join(projectRoot, '.claude', 'harness', 'output');

  // 确保输出目录存在
  fs.mkdirSync(outputDir, { recursive: true });

  // ========== 检查 1: PM Agent 是否启用 ==========
  const autonomousMode = teamConfig?.autonomousMode;
  const pmAgentConfig = teamConfig?.team?.members?.find((m: any) => m.role === 'pm');

  if (!autonomousMode?.enabled || !pmAgentConfig) {
    result.message = '⚠️ PM Agent 自主模式未启用，当前为人工协作模式';
    result.data = {
      pmAgentActive: false,
      currentPhase: 'manual',
      assignedTasks: [],
      blockedTasks: [],
      nextActions: ['在 team.json 中启用 autonomousMode']
    };
    return result;
  }

  // ========== 检查 2: 读取当前任务状态 ==========
  const taskFilePath = path.join(projectRoot, 'TASK.md');
  let taskContent = '';
  let frontMatterRaw: Record<string, string> = {};

  if (fs.existsSync(taskFilePath)) {
    taskContent = fs.readFileSync(taskFilePath, 'utf-8');
    frontMatterRaw = parseFrontMatter(taskContent);
  }

  // ========== 检查 3: 确定当前阶段 ==========
  const checkpoints = autonomousMode.checkpoints || [];
  let currentPhase = 'unknown';

  // 根据 TASK.md 内容判断阶段
  if (taskContent.includes('需求确认') || taskContent.includes('需求待确认')) {
    currentPhase = 'requirement-pending';
  } else if (taskContent.includes('需求已确认') && !taskContent.includes('设计已确认')) {
    currentPhase = 'design-pending';
  } else if (taskContent.includes('设计已确认') && !taskContent.includes('开发完成')) {
    currentPhase = 'development';
  } else if (taskContent.includes('开发完成') && !taskContent.includes('审查通过')) {
    currentPhase = 'review';
  } else if (taskContent.includes('审查通过')) {
    currentPhase = 'delivery-ready';
  } else {
    currentPhase = 'requirement-pending';
  }

  // ========== 检查 4: 分析任务分配情况 ==========
  const tasks = parseTasks(taskContent);
  const assignedTasks: PMResult['data']['assignedTasks'] = [];
  const blockedTasks: PMResult['data']['blockedTasks'] = [];

  for (const task of tasks) {
    if (task.status === 'blocked') {
      blockedTasks.push({
        taskId: task.id,
        reason: '任务阻塞，需要处理',
        needsUserInput: false
      });
    } else if (task.status === 'in_progress' || task.status === 'pending') {
      assignedTasks.push({
        taskId: task.id,
        assignee: task.assignee || '未分配',
        status: task.status
      });
    }
  }

  // ========== 检查 5: 检查是否需要用户确认 ==========
  const pendingUserConfirmations = [];

  // 需求确认 checkpoint
  if (currentPhase === 'requirement-pending') {
    pendingUserConfirmations.push({
      type: 'requirement',
      message: '需求已分析完成，等待用户确认需求和实现方案'
    });
  }

  // 设计确认 checkpoint
  if (currentPhase === 'design-pending') {
    pendingUserConfirmations.push({
      type: 'design',
      message: '设计方案已完成，等待用户确认技术方案'
    });
  }

  // 交付确认 checkpoint
  if (currentPhase === 'delivery-ready') {
    pendingUserConfirmations.push({
      type: 'delivery',
      message: '开发完成，等待用户验收交付结果'
    });
  }

  // ========== 生成下一步行动 ==========
  const nextActions: string[] = [];

  if (pendingUserConfirmations.length > 0) {
    for (const confirmation of pendingUserConfirmations) {
      nextActions.push(`[用户确认] ${confirmation.message}`);
    }
  } else if (blockedTasks.length > 0) {
    nextActions.push('[阻塞处理] 解决阻塞任务');
  } else if (assignedTasks.some(t => t.status === 'pending')) {
    nextActions.push('[任务分配] 分配待开始任务给合适的 Agent');
  } else {
    nextActions.push('[正常推进] 继续当前开发任务');
  }

  // ========== 输出 PM 日志 ==========
  const pmLogFile = path.join(outputDir, 'pm-agent.log');
  const pmLogEntry = {
    timestamp: new Date().toISOString(),
    phase: currentPhase,
    assignedTasks: assignedTasks.length,
    blockedTasks: blockedTasks.length,
    pendingConfirmations: pendingUserConfirmations.length,
    nextActions
  };

  fs.appendFileSync(pmLogFile, JSON.stringify(pmLogEntry, null, 2) + '\n\n');

  // ========== 构建结果 ==========
  result.data = {
    pmAgentActive: true,
    currentPhase,
    assignedTasks,
    blockedTasks,
    nextActions
  };

  if (pendingUserConfirmations.length > 0) {
    result.message = `⏸️ PM Agent: 当前阶段 [${currentPhase}]，等待用户确认\n\n`;
    for (const confirmation of pendingUserConfirmations) {
      result.message += `📋 ${confirmation.message}\n`;
    }
    result.warnings.push(`有 ${pendingUserConfirmations.length} 项需要用户确认`);
  } else {
    result.message = `✅ PM Agent: 当前阶段 [${currentPhase}]，正常推进中\n\n`;
    result.message += `📊 任务状态:\n`;
    result.message += `   - 已分配任务：${assignedTasks.length}\n`;
    result.message += `   - 阻塞任务：${blockedTasks.length}\n`;
    result.message += `\n📋 下一步行动:\n`;
    for (const action of nextActions) {
      result.message += `   - ${action}\n`;
    }
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

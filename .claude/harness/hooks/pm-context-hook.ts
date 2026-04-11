/**
 * 项目管理上下�?Hook
 *
 * 目的：为 PM-Agent 注入项目管理上下�? * - 当前 TASK.md 状�? * - 活跃 teammates 列表
 * - 任务分配历史
 * - 团队协作规则
 */

import * as fs from 'fs';
import * as path from 'path';

interface HookResult {
  passed: boolean;
  message: string;
  warnings: string[];
  errors: string[];
  data?: {
    taskStatus: string;
    assignee: string;
    activeTeammates: string[];
    collaborationRules: string[];
  };
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

export async function run(args: string[]): Promise<HookResult> {
  const result: HookResult = {
    passed: true,
    message: '',
    warnings: [],
    errors: []
  };

  const projectRoot = findProjectRoot();

  // 读取 TASK.md
  const taskFilePath = path.join(projectRoot, 'TASK.md');
  let taskStatus = 'unknown';
  let assignee = 'unassigned';

  if (fs.existsSync(taskFilePath)) {
    const taskContent = fs.readFileSync(taskFilePath, 'utf-8');
    const frontMatterMatch = taskContent.match(/^---\n([\s\S]*?)\n---/);

    if (frontMatterMatch) {
      const statusMatch = frontMatterMatch[1].match(/status:\s*(\w+)/);
      const assigneeMatch = frontMatterMatch[1].match(/assignee:\s*(.+)/);

      if (statusMatch) taskStatus = statusMatch[1];
      if (assigneeMatch) assignee = assigneeMatch[1].trim();
    }
  }

  // 读取 team.json
  const teamConfigPath = path.join(projectRoot, '.claude', 'harness', 'team.json');
  const activeTeammates: string[] = [];
  const collaborationRules: string[] = [];

  if (fs.existsSync(teamConfigPath)) {
    const teamConfig = JSON.parse(fs.readFileSync(teamConfigPath, 'utf-8'));

    // 获取活跃 teammates
    if (teamConfig.team?.members) {
      teamConfig.team.members
        .filter((m: any) => m.active)
        .forEach((m: any) => activeTeammates.push(m.name));
    }

    // 获取协作规则
    if (teamConfig.collaboration?.taskAssignment) {
      const rules = teamConfig.collaboration.taskAssignment;
      if (rules.requireAssignee) collaborationRules.push('任务必须指定负责�?);
      if (!rules.allowSelfAssign) collaborationRules.push('禁止自我分配任务');
      if (rules.maxConcurrentTasks) collaborationRules.push(`最大并发任务数�?{rules.maxConcurrentTasks}`);
    }
  }

  result.message = `�?项目管理上下文已加载 - 任务状态：${taskStatus}, 负责人：${assignee}`;

  result.data = {
    taskStatus,
    assignee,
    activeTeammates,
    collaborationRules
  };

  // 写入上下文文件供 PM-Agent 读取
  const outputDir = path.join(projectRoot, '.harness', 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  const contextFile = path.join(outputDir, 'pm-context.json');
  fs.writeFileSync(contextFile, JSON.stringify(result.data, null, 2), 'utf-8');

  return result;
}

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
        message: `钩子执行失败�?{error.message}`,
        errors: [error.message],
        warnings: []
      }, null, 2));
      process.exit(1);
    });
}

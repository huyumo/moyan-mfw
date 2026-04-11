/**
 * Teammates 多 Agent 协作 Hook
 *
 * 目的：根据团队配置自动管理子 Agent 的 spawn 和任务分配
 *
 * 使用方式：
 *   在会话开始时检查是否需要 spawn 子 Agent
 *
 * 输出格式：
 *   - 如果需要 spawn Agent，输出特殊标记 "SPAWN_AGENT:{...}"
 *   - 主 Agent 检测到该标记后，使用 Agent 工具创建子 Agent
 *
 * @returns {Promise<HookResult>}
 */

import * as fs from 'fs';
import * as path from 'path';

interface HookResult {
  passed: boolean;
  message: string;
  warnings: string[];
  errors: string[];
  data?: {
    teammatesEnabled: boolean;
    activeTeammates: number;
    maxTeammates: number;
    spawnedAgents: string[];
    suggestedAgents?: Array<{
      name: string;
      task: string;
      reason: string;
    }>;
  };
}

interface SpawnSuggestion {
  name: string;
  task: string;
  reason: string;
}

/**
 * 分析任务内容，判断是否需要 spawn Agent
 */
function analyzeTaskForSpawn(taskContent: string): SpawnSuggestion[] {
  const suggestions: SpawnSuggestion[] = [];

  // 检查任务复杂度
  const lines = taskContent.split('\n');
  const pendingTasks: string[] = [];

  for (const line of lines) {
    if (line.includes('- [ ]') || line.includes('- [x]')) {
      const taskMatch = line.match(/- \[[ x]\] (.+)/);
      if (taskMatch) {
        pendingTasks.push(taskMatch[1]);
      }
    }
  }

  // 如果待办任务超过 10 个，建议 spawn
  if (pendingTasks.length > 10) {
    suggestions.push({
      name: 'Dev-Agent',
      task: '并行开发独立页面模块',
      reason: `检测到 ${pendingTasks.length} 个待办任务，建议 spawn Dev-Agent 并行处理`
    });
  }

  // 检查是否需要代码审查
  if (taskContent.includes('审查') || taskContent.includes('review')) {
    suggestions.push({
      name: 'QA-Agent',
      task: '代码审查和质量检查',
      reason: '检测到需要代码审查的任务'
    });
  }

  return suggestions;
}

/**
 * 生成 spawn 建议文件，供主 Agent 读取
 */
function writeSpawnSuggestion(suggestions: SpawnSuggestion[], outputDir: string) {
  const suggestionFile = path.join(outputDir, 'spawn-suggestion.json');
  fs.writeFileSync(suggestionFile, JSON.stringify(suggestions, null, 2), 'utf-8');
}

/**
 * 向上查找项目根目录（查找 TASK.md 文件）
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

export async function run(args: string[]): Promise<HookResult> {
  const result: HookResult = {
    passed: true,
    message: '',
    warnings: [],
    errors: []
  };

  // 获取项目根目录
  const projectRoot = findProjectRoot();
  const teamConfigPath = path.join(projectRoot, '.claude', 'harness', 'team.json');
  const outputDir = path.join(projectRoot, '.claude', 'harness', 'output');

  // 加载团队配置
  let teamConfig: Record<string, any> | null = null;
  if (fs.existsSync(teamConfigPath)) {
    teamConfig = JSON.parse(fs.readFileSync(teamConfigPath, 'utf-8'));
  } else {
    result.message = '⚠️ 未找到 team.json 配置，Teammates 功能不可用';
    return result;
  }

  // 检查 Teammates 配置
  const teammatesConfig = teamConfig?.teammates;
  if (!teammatesConfig?.enabled) {
    result.message = 'ℹ️ Teammates 功能未启用';
    result.data = {
      teammatesEnabled: false,
      activeTeammates: 0,
      maxTeammates: 0,
      spawnedAgents: []
    };
    return result;
  }

  // 读取已 spawn 的 Agent 记录
  const teammatesLogFile = path.join(outputDir, 'teammates.log');
  let activeTeammates: Array<{ name: string; task: string; spawnedAt: string }> = [];

  if (fs.existsSync(teammatesLogFile)) {
    const content = fs.readFileSync(teammatesLogFile, 'utf-8');
    try {
      activeTeammates = JSON.parse(content);
    } catch {
      activeTeammates = [];
    }
  }

  const maxTeammates = teammatesConfig.maxConcurrentTeammates || 3;

  // 检查是否超过最大 Agent 数
  if (activeTeammates.length >= maxTeammates) {
    result.warnings.push(`⚠️ 已达到最大 Agent 数量限制 (${maxTeammates})`);
  }

  // 检查任务分配策略
  const taskDistribution = teammatesConfig.taskDistribution?.strategy || 'skill-based';

  // 读取当前任务
  const taskFilePath = path.join(projectRoot, 'TASK.md');
  let spawnSuggestions: SpawnSuggestion[] = [];

  if (fs.existsSync(taskFilePath)) {
    const taskContent = fs.readFileSync(taskFilePath, 'utf-8');
    const frontMatterMatch = taskContent.match(/^---\n([\s\S]*?)\n---/);

    if (frontMatterMatch) {
      const frontMatterRaw: Record<string, string> = {};
      const lines = frontMatterMatch[1].split('\n');
      for (const line of lines) {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) {
          frontMatterRaw[match[1]] = match[2].trim();
        }
      }

      // 检查是否需要 spawn 新 Agent
      const needsNewAgent = taskContent.includes('需要 spawn Agent') ||
                           taskContent.includes('需要多 Agent 协作') ||
                           taskContent.includes('并行处理');

      if (needsNewAgent && activeTeammates.length < maxTeammates) {
        result.warnings.push('⚠️ 检测到需要多 Agent 协作的任务，建议 spawn 新 Agent');
        result.message = `⚠️ 建议 spawn 新 Agent 处理并行任务（当前 ${activeTeammates.length}/${maxTeammates}）`;
      }

      // 分析任务复杂度，生成 spawn 建议
      spawnSuggestions = analyzeTaskForSpawn(taskContent);
      if (spawnSuggestions.length > 0 && activeTeammates.length < maxTeammates) {
        result.warnings.push(`⚠️ 建议 spawn ${spawnSuggestions.length} 个 Agent 处理任务`);
      }
    }
  }

  // 写入 spawn 建议文件
  if (spawnSuggestions.length > 0) {
    writeSpawnSuggestion(spawnSuggestions, outputDir);
  }

  // 全部检查通过
  result.data = {
    teammatesEnabled: true,
    activeTeammates: activeTeammates.length,
    maxTeammates,
    spawnedAgents: activeTeammates.map(t => t.name),
    suggestedAgents: spawnSuggestions
  };

  result.message = `✅ Teammates 检查通过 - 当前 ${activeTeammates.length}/${maxTeammates} 个 Agent`;

  if (result.warnings.length > 0) {
    result.message += '\n\n警告:\n' + result.warnings.join('\n');
  }

  // 输出日志
  const logFile = path.join(projectRoot, '.claude', 'harness', 'output', 'teammates.log');
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

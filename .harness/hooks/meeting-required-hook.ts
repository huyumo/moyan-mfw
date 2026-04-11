/**
 * 多 Agent 会议强制 Hook (增强版)
 *
 * 目的：确保复杂任务有多 subagent 参与分析，避免单一 Agent 独立决策
 *
 * 检查项：
 * 1. 统一复杂任务检测（使用 utils/task-complexity.ts）
 * 2. Agent 参与内容质量验证（使用 utils/agent-participation.ts）
 * 3. 特定角色参与要求（根据任务类型）
 * 4. 会议纪要强制要求（复杂任务必须有）
 * 5. 时间戳顺序验证（防止事后补文件）
 *
 * @returns {Promise<HookResult>}
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  analyzeTaskComplexity,
  getRequiredRolesForTask
} from '../utils/task-complexity';
import {
  validateMultipleAgents
} from '../utils/agent-participation';
import { HOOK_CONFIG } from '../config/hook-config';

interface HookResult {
  passed: boolean;
  message: string;
  warnings: string[];
  errors: string[];
  data?: {
    meetingRequired: boolean;
    agentsParticipated: string[];
    requiredAgents: string[];
    missingRequiredAgents: string[];
    meetingNotesExist: boolean;
    meetingNotesContentValid: boolean;
    handoffDocumentsExist: string[];
    timestampValid: boolean;
  };
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

/**
 * 检查会议纪要文档（强制要求）
 */
function checkMeetingNotes(outputDir: string): {
  exists: boolean;
  files: string[];
  contentValid: boolean;
  errors: string[];
} {
  const meetingFiles: string[] = [];
  const errors: string[] = [];

  const patterns = [
    /meeting-.*\.md$/i,
    /协调会议.*\.md$/i,
    /对齐.*\.md$/i,
    /handoff.*\.md$/i,
    /交接.*\.md$/i,
    /会议纪要.*\.md$/i
  ];

  if (fs.existsSync(outputDir)) {
    const files = fs.readdirSync(outputDir);
    for (const file of files) {
      for (const pattern of patterns) {
        if (pattern.test(file)) {
          meetingFiles.push(file);
          break;
        }
      }
    }
  }

  // 验证会议纪要内容质量
  let contentValid = false;
  if (meetingFiles.length > 0) {
    for (const file of meetingFiles) {
      const filePath = path.join(outputDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // 检查必要字段
      const requiredFields = [
        /参与 (Agent|代理)|参与者/,
        /讨论 | 分析 | 意见/,
        /结论 | 决策 | 决定/,
        /时间 | 日期/
      ];

      const foundFields = requiredFields.filter(pattern => pattern.test(content));

      if (foundFields.length >= HOOK_CONFIG.meetingNotes.minRequiredFields) {
        contentValid = true;
        break;
      }
    }

    if (!contentValid) {
      errors.push('会议纪要内容不完整，缺少必要字段（参与者、讨论、结论、时间）');
    }
  } else {
    errors.push('未找到会议纪要文档');
  }

  return {
    exists: meetingFiles.length > 0,
    files: meetingFiles,
    contentValid,
    errors
  };
}

/**
 * 验证时间戳顺序（防止事后补文件）
 */
function validateTimestamps(
  agentMemoryDir: string,
  taskFilePath: string
): {
  valid: boolean;
  errors: string[];
  details: string;
} {
  const errors: string[] = [];

  if (!fs.existsSync(taskFilePath)) {
    return { valid: false, errors: ['TASK.md 不存在'], details: '' };
  }

  const taskStat = fs.statSync(taskFilePath);
  const taskModifiedTime = taskStat.mtimeMs;

  // 获取 Agent 记忆文件的时间
  let earliestAgentTime = Infinity;
  let latestAgentTime = 0;
  let fileCount = 0;

  if (fs.existsSync(agentMemoryDir)) {
    const agentDirs = fs.readdirSync(agentMemoryDir).filter((d: string) => {
      const stat = fs.statSync(path.join(agentMemoryDir, d));
      return stat.isDirectory();
    });

    for (const dir of agentDirs) {
      const dirPath = path.join(agentMemoryDir, dir);
      const files = fs.readdirSync(dirPath).filter((f: string) => f.endsWith('.md'));

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.mtimeMs < earliestAgentTime) {
          earliestAgentTime = stat.mtimeMs;
        }
        if (stat.mtimeMs > latestAgentTime) {
          latestAgentTime = stat.mtimeMs;
        }
        fileCount++;
      }
    }
  }

  // 如果没有 Agent 文件，跳过时间戳检查
  if (fileCount === 0) {
    return { valid: true, errors: [], details: '无 Agent 记忆文件' };
  }

  const allowedDelayMs = HOOK_CONFIG.timestamp.allowedDelayMinutes * 60 * 1000;

  // 时间戳验证逻辑：
  // 1. 最早的 Agent 文件应该在 TASK.md 之前或之后允许的时间窗口内
  //    - 这确保 Agent 是在任务分析阶段参与，而不是事后补的
  // 2. 如果最早的 Agent 文件晚于 TASK.md 超过允许时间，需要进一步检查
  //    - 如果最晚的文件在 TASK.md 之前，说明是正常的（Agent 参与早于任务创建）

  let details = `Agent 文件：${fileCount} 个，最早：${new Date(earliestAgentTime).toLocaleString()}, 最晚：${new Date(latestAgentTime).toLocaleString()}, 任务修改：${new Date(taskModifiedTime).toLocaleString()}`;

  // 情况 1: 最早的 Agent 文件在 TASK.md 之后超过允许时间
  if (earliestAgentTime !== Infinity && earliestAgentTime > taskModifiedTime + allowedDelayMs) {
    // 进一步检查：如果最晚的 Agent 文件在 TASK.md 之前，说明是正常的
    if (latestAgentTime < taskModifiedTime) {
      // 正常：大部分 Agent 参与在任务创建之前
      details += ' [正常：Agent 参与早于任务创建]';
      return { valid: true, errors: [], details };
    }
    // 异常：Agent 参与明显晚于任务创建，可能是事后补的
    errors.push(`Agent 参与时间晚于任务创建时间超过 ${HOOK_CONFIG.timestamp.allowedDelayMinutes} 分钟，可能是事后补充`);
  }

  // 情况 2: 所有 Agent 文件都在 TASK.md 之前很远（超过允许时间）
  if (latestAgentTime > 0 && latestAgentTime < taskModifiedTime - allowedDelayMs) {
    // Agent 参与太早，可能是之前任务的遗留
    details += ' [警告：Agent 参与时间较早]';
    // 这只是警告，不阻塞
  }

  return {
    valid: errors.length === 0,
    errors,
    details
  };
}

export async function run(_args: string[]): Promise<HookResult> {
  const result: HookResult = {
    passed: true,
    message: '',
    warnings: [],
    errors: []
  };

  const projectRoot = findProjectRoot();
  const taskFilePath = path.join(projectRoot, 'TASK.md');
  const agentMemoryDir = path.join(projectRoot, '.claude', 'agent-memory');
  const outputDir = path.join(projectRoot, '.harness', 'output');

  // 读取任务文件
  if (!fs.existsSync(taskFilePath)) {
    result.message = 'ℹ️ 未找到 TASK.md，跳过会议检查';
    return result;
  }

  const taskContent = fs.readFileSync(taskFilePath, 'utf-8');

  // 1. 分析任务复杂度（统一逻辑）
  const { isComplex, reasons } = analyzeTaskComplexity(taskContent);

  if (!isComplex) {
    result.message = 'ℹ️ 当前任务为简单任务，无需多 Agent 会议';
    result.data = {
      meetingRequired: false,
      agentsParticipated: [],
      requiredAgents: [],
      missingRequiredAgents: [],
      meetingNotesExist: false,
      meetingNotesContentValid: false,
      handoffDocumentsExist: [],
      timestampValid: true
    };
    return result;
  }

  // 2. 获取必需的角色
  const requiredRoles = getRequiredRolesForTask(taskContent);

  // 3. 验证 Agent 参与情况（内容质量）
  const { validAgents, invalidAgents, totalWordCount, hasMinRequiredAgents } =
    validateMultipleAgents(agentMemoryDir, requiredRoles);

  // 4. 检查会议纪要（强制要求）
  const { exists: meetingNotesExist, files: meetingFiles, contentValid: meetingNotesContentValid, errors: meetingErrors } = checkMeetingNotes(outputDir);

  // 5. 验证时间戳
  const { valid: timestampValid, errors: timestampErrors, details: timestampDetails } = validateTimestamps(agentMemoryDir, taskFilePath);

  // 综合判断
  const participationErrors = invalidAgents.map(a => `${a.name}: ${a.errors.join(', ')}`).join('; ');

  if (validAgents.length < 2) {
    result.passed = false;
    result.errors.push(`参与 Agent 数量不足：当前 ${validAgents.length} 个，需要至少 2 个`);
  }

  if (!hasMinRequiredAgents && requiredRoles.length > 0) {
    result.passed = false;
    result.errors.push(`缺少必需角色的 Agent: ${requiredRoles.join('、')}`);
  }

  if (!meetingNotesExist) {
    result.passed = false;
    result.errors.push('复杂任务必须有会议纪要文档');
  } else if (!meetingNotesContentValid) {
    result.passed = false;
    result.errors.push(...meetingErrors);
  }

  if (!timestampValid) {
    result.passed = false;
    result.errors.push(...timestampErrors);
  }

  if (result.passed === false) {
    result.message = '【阻塞】复杂任务需要多 Agent 协作会议:\n' +
      ` - 需要原因：${reasons.join('; ')}\n` +
      ` - 当前参与：${validAgents.length > 0 ? validAgents.join('、') : '无'} (${totalWordCount} 字)\n` +
      ` - 无效参与：${participationErrors || '无'}\n` +
      ` - 必需角色：${requiredRoles.length > 0 ? requiredRoles.join('、') : '无'}\n` +
      ` - 会议纪要：${meetingNotesExist ? (meetingNotesContentValid ? '✅' : '❌ 内容不完整') : '❌ 缺失'}\n` +
      ` - 时间戳：${timestampValid ? '✅' : '❌ 顺序异常'}${timestampDetails ? ` (${timestampDetails})` : ''}`;

    result.data = {
      meetingRequired: true,
      agentsParticipated: validAgents,
      requiredAgents: requiredRoles,
      missingRequiredAgents: requiredRoles.filter(r =>
        !validAgents.some(a => a.toLowerCase().includes(r.toLowerCase()))
      ),
      meetingNotesExist,
      meetingNotesContentValid,
      handoffDocumentsExist: meetingFiles,
      timestampValid
    };

    return result;
  }

  // 检查通过
  result.data = {
    meetingRequired: true,
    agentsParticipated: validAgents,
    requiredAgents: requiredRoles,
    missingRequiredAgents: [],
    meetingNotesExist,
    meetingNotesContentValid,
    handoffDocumentsExist: meetingFiles,
    timestampValid
  };

  result.message = `✅ 多 Agent 会议检查通过` +
    `\n - 需要原因：${reasons.join('; ')}` +
    `\n - 参与 Agent: ${validAgents.join('、')} (${totalWordCount} 字)` +
    `\n - 必需角色：${requiredRoles.join('、')}` +
    `\n - 会议纪要：${meetingNotesExist ? '✅ ' + meetingFiles.join('、') : '❌'}` +
    `\n - 时间戳：${timestampValid ? '✅' : '⚠️'}`;

  if (!timestampValid) {
    result.warnings.push('⚠️ Agent 参与时间晚于任务创建时间，建议确保在任务分析阶段参与');
  }

  // 输出日志
  const logFile = path.join(outputDir, 'meeting-required.log');
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

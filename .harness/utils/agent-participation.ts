/**
 * Agent 参与内容验证工具
 *
 * 验证 subagent 是否有实质性参与，防止空文件绕过
 */

import * as fs from 'fs';
import * as path from 'path';
import { HOOK_CONFIG } from '../config/hook-config';

// @ts-ignore - Node.js built-in modules

export interface AgentParticipationResult {
  hasValidParticipation: boolean;
  fileCount: number;
  totalWordCount: number;
  files: AgentFileResult[];
  errors: string[];
}

export interface AgentFileResult {
  path: string;
  wordCount: number;
  hasSubstantiveContent: boolean;
  hasPromptResponse: boolean;
  createdAt: number;
  modifiedAt: number;
}

/**
 * 检查 Agent 目录是否有实质性内容
 */
export function validateAgentParticipation(
  agentDir: string,
  agentName: string
): AgentParticipationResult {
  const result: AgentParticipationResult = {
    hasValidParticipation: false,
    fileCount: 0,
    totalWordCount: 0,
    files: [],
    errors: []
  };

  if (!fs.existsSync(agentDir)) {
    result.errors.push(`Agent 目录不存在：${agentDir}`);
    return result;
  }

  const files = fs.readdirSync(agentDir);
  const mdFiles = files.filter((f: string) => f.endsWith('.md'));

  if (mdFiles.length === 0) {
    result.errors.push(`Agent "${agentName}" 没有 Markdown 文件`);
    return result;
  }

  for (const file of mdFiles) {
    const filePath = path.join(agentDir, file);
    const stat = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    // 计算字数（中文字符 + 英文单词）
    const wordCount = countWords(content);

    // 检查是否有 prompt-response 交互记录
    const hasPromptResponse = checkPromptResponse(content);

    // 检查是否有实质性内容（非标题、非列表）
    const hasSubstantiveContent = checkSubstantiveContent(content);

    result.files.push({
      path: filePath,
      wordCount,
      hasSubstantiveContent,
      hasPromptResponse,
      createdAt: stat.birthtimeMs,
      modifiedAt: stat.mtimeMs
    });

    result.fileCount++;
    result.totalWordCount += wordCount;
  }

  // 综合判断 - 使用配置化的阈值
  const hasEnoughFiles = result.fileCount >= HOOK_CONFIG.agentParticipation.minFileCount;
  const hasEnoughWords = result.totalWordCount >= HOOK_CONFIG.agentParticipation.minWordCount;
  const hasAnySubstantiveContent = result.files.some(f => f.hasSubstantiveContent);

  if (!hasEnoughFiles) {
    result.errors.push(`文件数量不足：${result.fileCount} 个（需要至少 ${HOOK_CONFIG.agentParticipation.minFileCount} 个）`);
  }

  if (!hasEnoughWords) {
    result.errors.push(`字数不足：${result.totalWordCount} 字（需要至少 ${HOOK_CONFIG.agentParticipation.minWordCount} 字）`);
  }

  if (!hasAnySubstantiveContent) {
    result.errors.push(`没有实质性内容（可能只是标题或列表）`);
  }

  result.hasValidParticipation = hasEnoughFiles && hasEnoughWords && hasAnySubstantiveContent;

  return result;
}

/**
 * 统计字数（中文 + 英文）
 */
function countWords(content: string): number {
  // 中文字符
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  // 英文单词
  const englishWords = (content.match(/\b[a-zA-Z]+\b/g) || []).length;
  // 数字
  const numbers = (content.match(/\b\d+\b/g) || []).length;

  return chineseChars + englishWords + numbers;
}

/**
 * 检查是否有 prompt-response 交互记录
 */
function checkPromptResponse(content: string): boolean {
  const promptPatterns = [
    /prompt:/i,
    /用户:/,
    /assistant:/i,
    /<user>/i,
    /<assistant>/i,
    /问题：/,
    /回答：/,
    /任务：/,
    /输出：/
  ];

  const responsePatterns = [
    /思考：/,
    /分析：/,
    /总结：/,
    /建议：/,
    /方案：/,
    /tool_use/i,
    /Tool loaded/i
  ];

  const hasPrompt = promptPatterns.some(p => p.test(content));
  const hasResponse = responsePatterns.some(p => p.test(content));

  return hasPrompt && hasResponse;
}

/**
 * 检查是否有实质性内容（非标题、非列表）
 */
function checkSubstantiveContent(content: string): boolean {
  // 移除标题、列表、代码块
  const lines = content.split('\n');
  let substantiveLines = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // 跳过空行
    if (!trimmed) continue;

    // 跳过标题
    if (/^#+\s/.test(trimmed)) continue;

    // 跳过列表
    if (/^[-*+]\s/.test(trimmed)) continue;

    // 跳过代码块
    if (/^```/.test(trimmed)) continue;

    // 跳过引用
    if (/^>\s/.test(trimmed)) continue;

    // 跳过分隔线
    if (/^---+$/.test(trimmed)) continue;

    // 跳过 frontmatter
    if (/^---$/.test(trimmed)) continue;

    // 剩余的行认为是实质性内容
    substantiveLines++;

    // 至少有配置化的行数实质性内容
    if (substantiveLines >= HOOK_CONFIG.agentParticipation.minSubstantiveLines) {
      return true;
    }
  }

  return substantiveLines >= HOOK_CONFIG.agentParticipation.minSubstantiveLines;
}

/**
 * 检查多个 Agent 的参与情况
 */
export function validateMultipleAgents(
  agentMemoryDir: string,
  requiredAgents?: string[]
): {
  validAgents: string[];
  invalidAgents: Array<{ name: string; errors: string[] }>;
  totalWordCount: number;
  hasMinRequiredAgents: boolean;
} {
  const validAgents: string[] = [];
  const invalidAgents: Array<{ name: string; errors: string[] }> = [];
  let totalWordCount = 0;

  if (!fs.existsSync(agentMemoryDir)) {
    return {
      validAgents: [],
      invalidAgents: [],
      totalWordCount: 0,
      hasMinRequiredAgents: false
    };
  }

  const agentDirs = fs.readdirSync(agentMemoryDir).filter((d: string) => {
    const stat = fs.statSync(path.join(agentMemoryDir, d));
    return stat.isDirectory();
  });

  for (const dir of agentDirs) {
    const dirPath = path.join(agentMemoryDir, dir);
    const result = validateAgentParticipation(dirPath, dir);

    if (result.hasValidParticipation) {
      validAgents.push(dir);
      totalWordCount += result.totalWordCount;
    } else {
      invalidAgents.push({
        name: dir,
        errors: result.errors
      });
    }
  }

  // 检查是否有必需角色的 Agent
  let hasMinRequiredAgents = validAgents.length >= 2;

  if (requiredAgents && requiredAgents.length > 0) {
    for (const required of requiredAgents) {
      const found = validAgents.some(agent =>
        agent.toLowerCase().includes(required.toLowerCase())
      );
      if (!found) {
        hasMinRequiredAgents = false;
        invalidAgents.push({
          name: required,
          errors: [`必需的 Agent "${required}" 未参与`]
        });
      }
    }
  }

  return {
    validAgents,
    invalidAgents,
    totalWordCount,
    hasMinRequiredAgents
  };
}

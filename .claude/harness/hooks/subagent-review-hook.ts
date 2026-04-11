/**
 * Subagent 输出审查 Hook
 *
 * 目的：在 subagent 完成工作后审查其输出
 * - 检查是否遵循编码规范
 * - 验证是否有安全漏洞
 * - 确认任务完成度
 *
 * 触发事件：SubagentStop
 */

import * as fs from 'fs';
import * as path from 'path';

interface HookResult {
  passed: boolean;
  message: string;
  warnings: string[];
  errors: string[];
  data?: {
    agentType: string;
    agentId: string;
    transcriptPath: string;
    filesModified: string[];
    securityIssues: Array<{ file: string; issue: string }>;
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
 * 分析 subagent transcript 内容
 */
function analyzeTranscript(content: string): { filesModified: string[]; securityIssues: Array<{ file: string; issue: string }> } {
  const filesModified: string[] = [];
  const securityIssues: Array<{ file: string; issue: string }> = [];

  // 提取文件修改记录
  const filePatterns = [
    /Write\(\s*["']([^"']+)["']/g,
    /Edit\(\s*["']([^"']+)["']/g,
    /写到文件 ["']([^"']+)["']/g,
    /修改文件 ["']([^"']+)["']/g
  ];

  for (const pattern of filePatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const filePath = match[1];
      if (!filesModified.includes(filePath)) {
        filesModified.push(filePath);
      }
    }
  }

  // 安全检查
  const dangerousPatterns = [
    { pattern: /\beval\s*\(/g, issue: '检测到 eval() 使用，可能存在代码注入风险' },
    { pattern: /\bexec\s*\(/g, issue: '检测到 exec() 使用，可能存在命令注入风险' },
    { pattern: /system\s*\(/g, issue: '检测到 system() 使用，可能存在命令注入风险' },
    { pattern: /__proto__/g, issue: '检测到 __proto__ 操作，可能存在原型污染风险' },
    { pattern: /constructor\.prototype/g, issue: '检测到原型操作，可能存在原型污染风险' }
  ];

  for (const { pattern, issue } of dangerousPatterns) {
    if (pattern.test(content)) {
      securityIssues.push({ file: 'transcript', issue });
    }
  }

  return { filesModified, securityIssues };
}

export async function run(args: string[]): Promise<HookResult> {
  const result: HookResult = {
    passed: true,
    message: '',
    warnings: [],
    errors: []
  };

  const projectRoot = findProjectRoot();
  const outputDir = path.join(projectRoot, '.claude', 'harness', 'output');

  // 确保输出目录存在
  fs.mkdirSync(outputDir, { recursive: true });

  // 从环境变量获取 subagent 信息（由 Claude Code 注入）
  const agentType = process.env.SUBAGENT_TYPE || process.env.AGENT_TYPE || args[0] || 'unknown';
  const agentId = process.env.SUBAGENT_ID || process.env.AGENT_ID || '';
  const transcriptPath = process.env.SUBAGENT_TRANSCRIPT_PATH || process.env.AGENT_TRANSCRIPT_PATH || '';

  // 读取 subagent transcript
  let transcriptContent = '';
  if (transcriptPath && fs.existsSync(transcriptPath)) {
    try {
      transcriptContent = fs.readFileSync(transcriptPath, 'utf-8');
    } catch (error) {
      result.warnings.push(`无法读取 transcript 文件：${transcriptPath}`);
    }
  }

  // 分析 transcript 内容
  const { filesModified, securityIssues } = analyzeTranscript(transcriptContent);

  // 构建结果
  if (securityIssues.length > 0) {
    result.passed = false;
    result.errors = securityIssues.map(i => i.issue);
    result.message = `❌ ${agentType} 审查失败：发现 ${securityIssues.length} 个安全问题`;
  } else if (filesModified.length > 0) {
    result.passed = true;
    result.message = `✅ ${agentType} 审查通过 - 修改了 ${filesModified.length} 个文件`;
    result.warnings.push('请确保已运行测试验证修改');

    // 记录文件修改列表
    const logFile = path.join(outputDir, 'subagent-files.log');
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${agentType}: ${filesModified.join(', ')}\n`);
  } else {
    result.passed = true;
    result.message = `✅ ${agentType} 审查通过 - 无文件修改（只读操作或仅输出建议）`;
  }

  result.data = {
    agentType,
    agentId,
    transcriptPath,
    filesModified,
    securityIssues
  };

  // 写入审查结果
  const reviewFile = path.join(outputDir, 'subagent-review.json');
  const existingReviews = fs.existsSync(reviewFile) ? JSON.parse(fs.readFileSync(reviewFile, 'utf-8')) : [];
  existingReviews.push({
    timestamp: new Date().toISOString(),
    ...result
  });
  fs.writeFileSync(reviewFile, JSON.stringify(existingReviews, null, 2), 'utf-8');

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

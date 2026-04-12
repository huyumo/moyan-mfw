/**
 * 文档规范检查 Hook
 *
 * 目的：确保创建 docs/ 目录下的 .md 文件前，已经调用了 DOC-001 智能体进行规划
 *
 * 检查项：
 * 1. 检测是否写入 docs/ 目录下的 .md 文件
 * 2. 检查当前会话是否调用过 docs-architect 智能体
 * 3. 检查文档存放位置是否符合规范
 * 4. 检查文档命名是否符合规范（YYYY-MM-DD_主题.md）
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
    filePath: string;
    docsArchitectCalled: boolean;
    namingConvention: boolean;
    locationValid: boolean;
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
 * 检查文档命名是否符合规范：YYYY-MM-DD_主题.md
 */
function checkNamingConvention(fileName: string): boolean {
  // 排除特定文件：README.md、索引类文件
  const exemptFiles = ['README.md', '索引.md', 'CHANGELOG.md', '.gitkeep'];
  if (exemptFiles.includes(fileName)) {
    return true;
  }

  // 检查是否符合 YYYY-MM-DD_*.md 格式
  const datePattern = /^\d{4}-\d{2}-\d{2}_.+\.md$/i;
  return datePattern.test(fileName);
}

/**
 * 检查文档存放位置是否在有效的子目录下
 */
function checkLocation(filePath: string): { valid: boolean; message: string } {
  const docsTeamPattern = /docs[\\/]02-团队[\\/]/;

  // 如果不是团队文档，跳过检查
  if (!docsTeamPattern.test(filePath)) {
    return { valid: true, message: '非团队文档，跳过位置检查' };
  }

  // 团队文档必须在编号子目录下
  const validSubdirs = [
    '01-团队规范',
    '02-检查清单',
    '03-评审报告',
    '04-会议纪要',
    '05-协作模板'
  ];

  const relativePath = filePath.replace(/.*docs[\\/]02-团队[\\/]/, '');
  const parts = relativePath.split(/[\\/]/);

  if (parts.length === 0) {
    return {
      valid: false,
      message: '团队文档必须存放在编号子目录下（如 01-团队规范/、03-评审报告/等）'
    };
  }

  const topDir = parts[0];
  const isValidSubdir = validSubdirs.some(subdir => topDir === subdir);

  if (!isValidSubdir) {
    return {
      valid: false,
      message: `团队文档必须存放在编号子目录下，当前目录 "${topDir}" 无效。有效目录：${validSubdirs.join(', ')}`
    };
  }

  return { valid: true, message: '文档位置符合规范' };
}

/**
 * 检查是否调用过 docs-architect 智能体
 *
 * 通过检查 hook 日志来判断
 */
function checkDocsArchitectCalled(projectRoot: string): boolean {
  const hookLogPath = path.join(projectRoot, '.harness', 'output', 'logs', 'hook-calls.log');

  if (!fs.existsSync(hookLogPath)) {
    // 日志文件不存在，可能是新会话，检查其他线索
    const outputDir = path.join(projectRoot, '.harness', 'output');
    if (fs.existsSync(outputDir)) {
      const files = fs.readdirSync(outputDir);
      // 检查是否有 docs-template 相关输出
      const hasDocsTemplateOutput = files.some(f =>
        f.includes('docs') || f.includes('template')
      );
      if (hasDocsTemplateOutput) {
        return true;
      }
    }
    return false;
  }

  const logContent = fs.readFileSync(hookLogPath, 'utf-8');

  // 检查是否有 docs-template hook 调用
  const hasDocsTemplateHook = logContent.includes('hook:docs-template') ||
                               logContent.includes('docs-architect');

  return hasDocsTemplateHook;
}

/**
 * 检查会话日志中是否有 Agent 调用记录
 */
function checkAgentCallInSession(projectRoot: string): boolean {
  // 检查是否有 subagent 输出文件
  const subagentOutputs = [
    'docs-template.md',
    'docs-plan.md',
    'doc-plan.md'
  ];

  const outputDir = path.join(projectRoot, '.harness', 'output');
  if (!fs.existsSync(outputDir)) {
    return false;
  }

  const files = fs.readdirSync(outputDir);
  return files.some(f => subagentOutputs.includes(f));
}

/**
 * 检查是否为豁免的文档类型
 */
function isExemptDocument(filePath: string): boolean {
  const exemptPatterns = [
    /docs[\\/]02-团队[\\/]前端项目摸底测试.*\.md$/,  // 旧文档占位文件
    /docs[\\/]README\.md$/,
    /docs[\\].*\/README\.md$/,
    /docs[\\].*\/索引\.md$/,
    /CHANGELOG\.md$/,
    /\.gitkeep$/
  ];

  return exemptPatterns.some(pattern => pattern.test(filePath));
}

export async function run(args: string[]): Promise<HookResult> {
  const result: HookResult = {
    passed: true,
    message: '',
    warnings: [],
    errors: [],
    data: {
      filePath: '',
      docsArchitectCalled: false,
      namingConvention: false,
      locationValid: false
    }
  };

  const projectRoot = findProjectRoot();

  // 从参数中获取文件路径（由 .claude/settings.json 传递）
  // 格式：hook:docs-norm <filePath>
  const filePath = args[0];

  if (!filePath) {
    result.message = '⚠️ 未提供文件路径，跳过文档规范检查';
    return result;
  }

  // 检查是否是 docs/ 目录下的 .md 文件
  const normalizedPath = filePath.replace(/\\/g, '/');
  const isDocsFile = normalizedPath.includes('docs/') && normalizedPath.endsWith('.md');

  if (!isDocsFile) {
    result.message = '✅ 非文档文件，跳过文档规范检查';
    return result;
  }

  // 检查是否为豁免文档
  if (isExemptDocument(filePath)) {
    result.message = '✅ 豁免文档类型，跳过规范检查';
    return result;
  }

  result.data.filePath = filePath;
  const fileName = path.basename(filePath);
  const dirPath = path.dirname(filePath);

  // ========== 检查 1: 是否调用过 DOC-001 ==========
  const docsArchitectCalled = checkDocsArchitectCalled(projectRoot) || checkAgentCallInSession(projectRoot);
  result.data.docsArchitectCalled = docsArchitectCalled;

  if (!docsArchitectCalled) {
    result.errors.push(
      '❌ 未检测到调用 DOC-001 (docs-architect) 智能体\n' +
      '   要求：创建 docs/ 目录下的 .md 文件前，必须先调用 DOC-001 进行规划\n' +
      '   \n' +
      '   正确做法：\n' +
      '   ```\n' +
      '   Agent({\n' +
      '     subagent_type: "docs-architect",\n' +
      '     prompt: "规划文档结构和存放位置：[文档主题]"\n' +
      '   })\n' +
      '   ```\n' +
      '   \n' +
      '   参考：CLAUDE.md - 铁律 0：文档创建规范'
    );
    result.passed = false;
  }

  // ========== 检查 2: 文档命名规范 ==========
  const namingValid = checkNamingConvention(fileName);
  result.data.namingConvention = namingValid;

  if (!namingValid) {
    result.errors.push(
      `❌ 文档命名不符合规范：${fileName}\n` +
      `   要求格式：YYYY-MM-DD_主题.md\n` +
      `   示例：2026-04-12_前端项目摸底测试报告.md\n` +
      `   \n` +
      `   注意：README.md、索引.md 等索引文件可豁免`
    );
    result.passed = false;
  }

  // ========== 检查 3: 文档存放位置 ==========
  const locationCheck = checkLocation(filePath);
  result.data.locationValid = locationCheck.valid;

  if (!locationCheck.valid) {
    result.errors.push(
      `❌ 文档存放位置不符合规范\n` +
      `   ${locationCheck.message}\n` +
      `   \n` +
      `   团队文档目录结构：\n` +
      `   docs/02-团队/\n` +
      `   ├── 01-团队规范/       # 团队章程、评审流程、任务模板、行动计划\n` +
      `   ├── 02-检查清单/       # 各角色检查清单\n` +
      `   ├── 03-评审报告/       # 文档/代码评审报告、测试报告\n` +
      `   ├── 04-会议纪要/       # 会议纪要存档\n` +
      `   └── 05-协作模板/       # API 变更通知单、问卷模板等协作模板`
    );
    result.passed = false;
  }

  // ========== 综合判断 ==========
  if (!result.passed) {
    result.message = '【阻塞】文档规范检查失败:\n' + result.errors.join('\n\n');

    // 输出日志
    const logFile = path.join(projectRoot, '.harness', 'output', 'docs-norm.log');
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${result.message}\n`);

    return result;
  }

  result.message = '✅ 文档规范检查通过\n' +
    ` - DOC-001 调用：${docsArchitectCalled ? '✅' : '⚠️ 未检测到（可能豁免）'}\n` +
    ` - 命名规范：${namingValid ? '✅' : '❌'}\n` +
    ` - 存放位置：${locationCheck.valid ? '✅' : '❌'}`;

  // 输出日志
  const logFile = path.join(projectRoot, '.harness', 'output', 'docs-norm.log');
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

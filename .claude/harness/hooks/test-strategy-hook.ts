/**
 * 测试策略检查（通用框架 - 项目特定内容在测试策略文档中定义）
 *
 * 目的：确保测试编写前已完成技术对齐，有文档记录
 *
 * 检查项：
 * 1. 如果任务涉及测试，检查是否存在测试策略文档
 * 2. 检查测试策略文档是否有基本结构（不关心具体技术栈）
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
}

/**
 * 简单的 YAML Front Matter 解析器
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
    if (parentDir === currentDir) break;
    currentDir = parentDir;
    depth++;
  }
  return process.cwd();
}

/**
 * 检查任务是否涉及测试
 */
function isTestTask(taskContent: string): boolean {
  const testPatterns = [
    /测试/i,
    /e2e/i,
    /playwright/i,
    /unit\s*test/i,
    /vitest/i,
    /spec\.ts/i,
    /test.*文件/i,
    /编写.*测试/i,
    /修复.*测试/i,
    /添加.*测试/i,
    /更新.*测试/i
  ];
  return testPatterns.some(pattern => pattern.test(taskContent));
}

/**
 * 检查测试策略文档的基本结构
 * 注意：这里只检查通用结构，不检查具体技术栈内容
 */
function checkTestStrategy(content: string): { passed: boolean; missingSections: string[] } {
  const requiredSections = [
    { name: '技术栈说明', keywords: ['技术栈', '框架', 'Framework', 'Stack'] },
    { name: '测试方法', keywords: ['测试方法', '模拟方式', 'Test Method', 'Approach'] },
    { name: '配置信息', keywords: ['配置', '端口', '端口', 'Config', 'Port', 'URL'] }
  ];

  const missingSections: string[] = [];

  for (const section of requiredSections) {
    const hasSection = section.keywords.some(keyword =>
      content.toLowerCase().includes(keyword.toLowerCase())
    );
    if (!hasSection) {
      missingSections.push(section.name);
    }
  }

  return {
    passed: missingSections.length === 0,
    missingSections
  };
}

export async function run(args: string[]): Promise<HookResult> {
  const result: HookResult = {
    passed: true,
    message: '',
    warnings: [],
    errors: []
  };

  const projectRoot = findProjectRoot();
  const taskFilePath = path.join(projectRoot, 'TASK.md');
  const harnessOutputDir = path.join(projectRoot, '.harness', 'output');

  // ========== 检查 1: 读取 TASK.md ==========
  if (!fs.existsSync(taskFilePath)) {
    result.errors.push('TASK.md 文件不存在');
    result.passed = false;
    return result;
  }

  const taskContent = fs.readFileSync(taskFilePath, 'utf-8');

  // ========== 检查 2: 判断是否是测试任务 ==========
  if (!isTestTask(taskContent)) {
    // 不是测试任务，直接通过
    result.message = '✅ 非测试任务，跳过测试策略检查';
    return result;
  }

  result.message = '📋 检测到测试任务，进行测试策略检查...\n\n';

  // ========== 检查 3: 检查测试策略文档是否存在 ==========
  const testStrategyPath = path.join(projectRoot, 'docs', 'test-strategy.md');

  if (!fs.existsSync(testStrategyPath)) {
    result.errors.push(
      '❌ 缺失测试策略文档 (docs/test-strategy.md)\n' +
      '   要求：测试编写前必须完成技术对齐，记录以下信息：\n' +
      '   - 技术栈说明（前端框架、路由模式等）\n' +
      '   - 测试方法（事件模拟方式、组件测试方法等）\n' +
      '   - 配置信息（端口、URL 等）\n' +
      '   参考模板：.claude/harness/templates/test-strategy-template.md'
    );
    result.passed = false;
    return result;
  }

  // ========== 检查 4: 检查测试策略文档内容 ==========
  const strategyContent = fs.readFileSync(testStrategyPath, 'utf-8');
  const strategyCheck = checkTestStrategy(strategyContent);

  if (!strategyCheck.passed) {
    result.errors.push(
      '❌ 测试策略文档缺少以下内容：\n' +
      `   - ${strategyCheck.missingSections.join('\n   - ')}`
    );
    result.passed = false;
  } else {
    result.message += '✅ 测试策略文档结构完整\n';
  }

  // ========== 检查 5: 检查技术对齐记录（警告级别） ==========
  const techAlignedPath = path.join(harnessOutputDir, 'tech-aligned.md');
  if (!fs.existsSync(techAlignedPath)) {
    result.warnings.push(
      '⚠️ 未找到技术对齐记录 (tech-aligned.md)\n' +
      '   建议：PM 应组织开发 + 测试进行技术对齐会议，记录关键决策'
    );
  } else {
    result.message += '✅ 技术对齐记录存在\n';
  }

  // ========== 综合判断 ==========
  if (!result.passed) {
    result.message = '【阻塞】测试策略检查失败:\n' + result.errors.join('\n');
    return result;
  }

  result.message += '\n✅ 测试策略检查通过';

  if (result.warnings.length > 0) {
    result.message += '\n\n警告:\n' + result.warnings.join('\n');
  }

  // ========== 输出日志 ==========
  const logFile = path.join(projectRoot, '.claude', 'harness', 'output', 'test-strategy.log');
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

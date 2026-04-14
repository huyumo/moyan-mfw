/**
 * 编码前检查 Hook（增强版 - 含测试策略检查）
 *
 * 目的：确保 AI 在开始写代码前已经完成了充分的需求分析
 *
 * 检查项：
 * 1. TASK.md 状态是否为 in_progress
 * 2. 是否有需求理解
 * 3. 是否有优缺点分析
 * 4. 是否有边界条件分析
 * 5. 是否有实现思路
 * 6. 是否有文件影响分析
 * 7. 【新增】如果是测试任务，检查测试策略文档
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
    taskStatus: string;
    relatedFiles: string[];
    analysisSections: {
      requirementAnalysis: boolean;
      prosConsAnalysis: boolean;
      boundaryAnalysis: boolean;
      implementationPlan: boolean;
      fileImpact: boolean;
    };
  };
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
 * 检查分析文档中是否包含指定章节
 */
function hasAnalysisSection(content: string, keywords: string[]): boolean {
  return keywords.some(keyword =>
    content.toLowerCase().includes(keyword.toLowerCase())
  );
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
 */
function checkTestStrategy(content: string): { passed: boolean; missingSections: string[] } {
  const requiredSections = [
    { name: '技术栈说明', keywords: ['技术栈', '框架', 'Framework', 'Stack'] },
    { name: '测试方法', keywords: ['测试方法', '模拟方式', 'Test Method', 'Approach'] },
    { name: '配置信息', keywords: ['配置', '端口', 'port', 'config', 'url', 'URL'] }
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

/**
 * 测试策略检查（集成到 pre-code 中）
 */
function checkTestStrategyTask(taskContent: string, projectRoot: string, harnessOutputDir: string): { errors: string[]; warnings: string[]; info: string[] } {
  const result = { errors: [] as string[], warnings: [] as string[], info: [] as string[] };

  // 判断是否是测试任务
  if (!isTestTask(taskContent)) {
    return result; // 非测试任务，跳过
  }

  // 检查测试策略文档是否存在
  const testStrategyPath = path.join(projectRoot, 'docs', 'test-strategy.md');

  if (!fs.existsSync(testStrategyPath)) {
    result.errors.push(
      '❌ 缺失测试策略文档 (docs/test-strategy.md)\n' +
      '   要求：测试编写前必须完成技术对齐，记录以下信息：\n' +
      '   - 技术栈说明（前端框架、路由模式等）\n' +
      '   - 测试方法（事件模拟方式、组件测试方法等）\n' +
      '   - 配置信息（端口、URL 等）\n' +
      '   参考模板：.harness/templates/test-strategy-template.md'
    );
    return result;
  }

  // 检查测试策略文档内容
  const strategyContent = fs.readFileSync(testStrategyPath, 'utf-8');
  const strategyCheck = checkTestStrategy(strategyContent);

  if (!strategyCheck.passed) {
    result.errors.push(
      '❌ 测试策略文档缺少以下内容：\n' +
      `   - ${strategyCheck.missingSections.join('\n   - ')}`
    );
  } else {
    result.info.push('✅ 测试策略文档结构完整');
  }

  // 检查技术对齐记录（警告级别）
  const techAlignedPath = path.join(harnessOutputDir, 'tech-aligned.md');
  if (!fs.existsSync(techAlignedPath)) {
    result.warnings.push(
      '⚠️ 未找到技术对齐记录 (tech-aligned.md)\n' +
      '   建议：PM 应组织开发 + 测试进行技术对齐会议，记录关键决策'
    );
  } else {
    result.info.push('✅ 技术对齐记录存在');
  }

  return result;
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

  // ========== 检查 1: TASK.md 状态 ==========
  let taskContent = '';
  let taskStatus = 'unknown';
  let isIndexFormat = false;

  if (fs.existsSync(taskFilePath)) {
    taskContent = fs.readFileSync(taskFilePath, 'utf-8');
    const frontMatterMatch = taskContent.match(/^---\n([\s\S]*?)\n---/);

    if (frontMatterMatch) {
      const frontMatter = parseFrontMatter(frontMatterMatch[1]);
      taskStatus = frontMatter.status || 'unknown';

      // 检查是否是任务索引格式
      isIndexFormat = frontMatter['active_tasks'] !== undefined ||
                      taskContent.includes('active_tasks:');

      // 索引格式允许编码（只要有活跃任务）
      if (isIndexFormat) {
        // 索引格式：检查是否有活跃任务
        const hasActiveTasks = taskContent.includes('status: in_progress');
        if (!hasActiveTasks) {
          result.warnings.push('⚠️ 任务索引中未找到进行中的任务，确认可以开始编码');
        }
        // 索引格式跳过状态检查
      } else if (taskStatus !== 'in_progress') {
        // 单任务格式：必须是 in_progress
        result.errors.push(
          `TASK.md 状态为 "${taskStatus}"，编码前应设置为 "in_progress"`
        );
        result.passed = false;
      }
    }
  } else {
    result.errors.push('TASK.md 文件不存在');
    result.passed = false;
  }

  // ========== 检查 2: 测试策略检查（新增） ==========
  const testStrategyResult = checkTestStrategyTask(taskContent, projectRoot, harnessOutputDir);
  result.errors.push(...testStrategyResult.errors);
  result.warnings.push(...testStrategyResult.warnings);
  if (testStrategyResult.errors.length > 0) {
    result.passed = false;
  }

  // ========== 检查 3: 查找分析文档 ==========
  const analysisFiles = [
    path.join(harnessOutputDir, 'task-analysis.md'),
    path.join(harnessOutputDir, 'analysis-notes.md'),
    path.join(harnessOutputDir, 'requirement-analysis.md'),
    path.join(harnessOutputDir, 'TASK.md')
  ];

  if (fs.existsSync(harnessOutputDir)) {
    const files = fs.readdirSync(harnessOutputDir);
    for (const file of files) {
      if (file.startsWith('analysis-') && file.endsWith('.md')) {
        const filePath = path.join(harnessOutputDir, file);
        if (!analysisFiles.includes(filePath)) {
          analysisFiles.push(filePath);
        }
      }
    }
  }

  let hasAnalysis = false;
  let analysisContent = '';

  for (const file of analysisFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      const contentWithoutFrontMatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');
      if (contentWithoutFrontMatter.length > 100) {
        hasAnalysis = true;
        analysisContent = contentWithoutFrontMatter;
        break;
      }
    }
  }

  if (!hasAnalysis) {
    result.errors.push('未找到需求分析文档，请先完成需求分析');
    result.passed = false;
  }

  // ========== 检查 4-7: 分析要素完整性 ==========
  const analysisSections = {
    requirementAnalysis: false,
    prosConsAnalysis: false,
    boundaryAnalysis: false,
    implementationPlan: false,
    fileImpact: false
  };

  if (hasAnalysis) {
    analysisSections.requirementAnalysis = hasAnalysisSection(analysisContent, [
      '需求理解', '需求分析', '核心需求', '用户需要', '目标',
      '## 需求', '## 理解', 'user needs', 'requirement'
    ]);

    analysisSections.prosConsAnalysis = hasAnalysisSection(analysisContent, [
      '优缺点', '优点', '缺点', '权衡', '利弊',
      '## 优点', '## 缺点', 'pros', 'cons', 'trade-off'
    ]);

    analysisSections.boundaryAnalysis = hasAnalysisSection(analysisContent, [
      '边界条件', '边界', '限制', '适用范围', '不适用范围',
      '## 边界', '## 限制', 'boundary', 'limitation', 'scope'
    ]);

    analysisSections.implementationPlan = hasAnalysisSection(analysisContent, [
      '实现思路', '技术方案', '实现步骤', '设计方案', '实施计划',
      '## 实现', '## 方案', '## 步骤', 'implementation', 'approach', 'plan'
    ]);

    analysisSections.fileImpact = hasAnalysisSection(analysisContent, [
      '文件影响', '会编辑', '会创建', '修改文件', '涉及文件',
      '## 文件', '相关文件', 'files to', 'will edit', 'will create'
    ]);
  }

  const missingSections: string[] = [];

  if (!analysisSections.requirementAnalysis) {
    missingSections.push('需求理解');
  }
  if (!analysisSections.prosConsAnalysis) {
    missingSections.push('优缺点分析');
  }
  if (!analysisSections.boundaryAnalysis) {
    missingSections.push('边界条件分析');
  }
  if (!analysisSections.implementationPlan) {
    missingSections.push('实现思路');
  }
  if (!analysisSections.fileImpact) {
    missingSections.push('文件影响分析');
  }

  if (missingSections.length > 0) {
    result.errors.push(
      `需求分析不完整，缺少以下内容：\n` +
      `  ❌ ${missingSections.join('\n  ❌ ')}\n\n` +
      `请先补充分析后再开始编码。`
    );
    result.passed = false;
  }

  // ========== 检查：是否识别了相关文件 ==========
  if (analysisContent) {
    const relatedFilePatterns = [
      /相关文件/i,
      /涉及文件/i,
      /修改范围/i,
      /文件路径/i,
      /会编辑/i,
      /会创建/i,
      /会删除/i,
      /文件影响/i
    ];

    const hasRelatedFiles = relatedFilePatterns.some(pattern =>
      pattern.test(analysisContent)
    );

    if (!hasRelatedFiles) {
      result.errors.push('未列出文件影响分析，请说明会编辑/创建哪些文件');
      result.passed = false;
    }
  }

  // ========== 检查：有待确认事项（警告） ==========
  if (analysisContent) {
    const pendingConfirmPatterns = [
      /待确认/i,
      /TODO[:\s]/i,
      /需要确认/i,
      /需要进一步明确/i,
      /待定/i
    ];

    const hasPendingItems = pendingConfirmPatterns.some(pattern =>
      pattern.test(analysisContent)
    );

    if (hasPendingItems) {
      result.warnings.push(
        '⚠️ 检测到有待确认事项，建议先与用户确认后再开始编码'
      );
    }
  }

  // ========== 综合判断 ==========
  if (!result.passed) {
    result.message = '【阻塞】编码前检查失败:\n' + result.errors.join('\n');
    return result;
  }

  result.data = {
    taskStatus: 'in_progress',
    relatedFiles: [],
    analysisSections
  };

  // 构建成功消息
  result.message = '✅ 编码前检查通过\n' +
    ` - 需求理解：${analysisSections.requirementAnalysis ? '✅' : '❌'}\n` +
    ` - 优缺点分析：${analysisSections.prosConsAnalysis ? '✅' : '❌'}\n` +
    ` - 边界条件：${analysisSections.boundaryAnalysis ? '✅' : '❌'}\n` +
    ` - 实现思路：${analysisSections.implementationPlan ? '✅' : '❌'}\n` +
    ` - 文件影响：${analysisSections.fileImpact ? '✅' : '❌'}`;

  // 添加测试策略检查信息
  if (testStrategyResult.info.length > 0) {
    result.message += '\n\n📋 测试策略检查:\n' + testStrategyResult.info.map(i => ` - ${i}`).join('\n');
  }

  if (result.warnings.length > 0) {
    result.message += '\n\n警告:\n' + result.warnings.join('\n');
  }

  // ========== 输出日志 ==========
  const logFile = path.join(projectRoot, '.harness', 'output', 'pre-code.log');
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

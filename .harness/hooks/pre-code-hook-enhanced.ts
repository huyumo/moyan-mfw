/**
 * 编码前检查 Hook（增强版）
 *
 * 目的：确保 AI 在开始写代码前已经完成了所有准备工作
 *
 * 检查项：
 * 1. TASK.md 状态是否为 in_progress
 * 2. 是否有需求分析文档
 * 3. 是否有优缺点分析（新增）
 * 4. 是否有边界条件分析（新增）
 * 5. 是否有实现思路（新增）
 * 6. 是否有文件影响分析（新增）
 * 7. 是否识别了相关文件
 * 8. 是否有待确认事项
 *
 * @returns {Promise<HookResult>}
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadPathsConfig, findProjectRoot } from '../utils/paths';

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

export async function run(args: string[]): Promise<HookResult> {
  const result: HookResult = {
    passed: true,
    message: '',
    warnings: [],
    errors: []
  };

  const projectRoot = findProjectRoot();
  const paths = loadPathsConfig(projectRoot);

  const taskFilePath = paths.input.taskFile;
  const harnessOutputDir = paths.output.directory;

  // ========== 检查 1: TASK.md 状态 ==========
  if (fs.existsSync(taskFilePath)) {
    const taskContent = fs.readFileSync(taskFilePath, 'utf-8');
    const frontMatterMatch = taskContent.match(/^---\n([\s\S]*?)\n---/);

    if (frontMatterMatch) {
      const frontMatter = parseFrontMatter(frontMatterMatch[1]);

      if (frontMatter.status !== 'in_progress') {
        result.errors.push(
          `TASK.md 状态为 "${frontMatter.status}"，编码前应设置为 "in_progress"`
        );
        result.passed = false;
      }
    }
  } else {
    result.errors.push('TASK.md 文件不存在');
    result.passed = false;
  }

  // ========== 检查 2: 查找分析文档 ==========
  const analysisFiles = [
    path.join(harnessOutputDir, 'task-analysis.md'),
    path.join(harnessOutputDir, 'analysis-notes.md'),
    path.join(harnessOutputDir, 'requirement-analysis.md'),
    taskFilePath  // 也可以检查 TASK.md 中是否有分析内容
  ];

  let hasAnalysis = false;
  let analysisContent = '';

  for (const file of analysisFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      // 跳过 YAML Front Matter
      const contentWithoutFrontMatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');
      if (contentWithoutFrontMatter.length > 100) {  // 至少 100 字才算有效分析
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

  // ========== 检查 3-6: 分析要素完整性（新增核心检查）==========
  const analysisSections = {
    requirementAnalysis: false,
    prosConsAnalysis: false,
    boundaryAnalysis: false,
    implementationPlan: false,
    fileImpact: false
  };

  if (hasAnalysis) {
    // 检查 3: 需求理解/需求分析
    analysisSections.requirementAnalysis = hasAnalysisSection(analysisContent, [
      '需求理解', '需求分析', '核心需求', '用户需要', '目标',
      '## 需求', '## 理解', 'user needs', 'requirement'
    ]);

    // 检查 4: 优缺点分析
    analysisSections.prosConsAnalysis = hasAnalysisSection(analysisContent, [
      '优缺点', '优点', '缺点', '权衡', '利弊',
      '## 优点', '## 缺点', 'pros', 'cons', 'trade-off'
    ]);

    // 检查 5: 边界条件分析
    analysisSections.boundaryAnalysis = hasAnalysisSection(analysisContent, [
      '边界条件', '边界', '限制', '适用范围', '不适用范围',
      '## 边界', '## 限制', 'boundary', 'limitation', 'scope'
    ]);

    // 检查 6: 实现思路/技术方案
    analysisSections.implementationPlan = hasAnalysisSection(analysisContent, [
      '实现思路', '技术方案', '实现步骤', '设计方案', '实施计划',
      '## 实现', '## 方案', '## 步骤', 'implementation', 'approach', 'plan'
    ]);

    // 检查 7: 文件影响分析
    analysisSections.fileImpact = hasAnalysisSection(analysisContent, [
      '文件影响', '会编辑', '会创建', '修改文件', '涉及文件',
      '## 文件', '相关文件', 'files to', 'will edit', 'will create'
    ]);
  }

  // 汇总分析要素检查结果
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

  // ========== 检查 7: 是否识别了相关文件 ==========
  if (analysisContent) {
    const relatedFilePatterns = [
      /相关文件 [`\s\S]*?(?:[`]{3})?/i,
      /涉及文件 [:：]\s*[\s\S]*?(?:\n|\n\n)/i,
      /修改范围 [:：]\s*[\s\S]*?(?:\n|\n\n)/i,
      /文件路径 [:：]\s*[\s\S]*?(?:\n|\n\n)/i,
      /会 [编辑 | 创建 | 删除] [:：]\s*[\s\S]*?(?:\n|\n\n)/i
    ];

    const hasRelatedFiles = relatedFilePatterns.some(pattern =>
      pattern.test(analysisContent)
    );

    if (!hasRelatedFiles) {
      result.errors.push('未列出文件影响分析，请说明会编辑/创建哪些文件');
      result.passed = false;
    }
  }

  // ========== 检查 8: 是否有"待确认"的标记 ==========
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

  // 检查全部通过
  result.data = {
    taskStatus: 'in_progress',
    relatedFiles: [],
    analysisSections
  };

  result.message = '✅ 编码前检查通过\n' +
    ` - 需求理解：${analysisSections.requirementAnalysis ? '✅' : '❌'}\n` +
    ` - 优缺点分析：${analysisSections.prosConsAnalysis ? '✅' : '❌'}\n` +
    ` - 边界条件：${analysisSections.boundaryAnalysis ? '✅' : '❌'}\n` +
    ` - 实现思路：${analysisSections.implementationPlan ? '✅' : '❌'}\n` +
    ` - 文件影响：${analysisSections.fileImpact ? '✅' : '❌'}`;

  if (result.warnings.length > 0) {
    result.message += '\n\n警告:\n' + result.warnings.join('\n');
  }

  // ========== 输出日志 ==========
  const logFile = paths.output.logs.preCode;
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

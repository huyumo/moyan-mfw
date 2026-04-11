/**
 * 任务分析强制 Hook（增强版）
 *
 * 目的：确保 AI 在开始编码前已经充分理解需求、分析边界条件、并确认技术方案
 *
 * 检查项：
 * 1. 是否存在需求分析文档/笔记
 * 2. 是否识别了边界条件
 * 3. 是否确认了技术方案
 * 4. 是否识别了风险点
 * 5. 是否与用户确认了关键决策
 * 6. 复杂任务是否有多 Agent 参与（强制）
 * 7. Agent 参与内容质量验证（防止空文件绕过）
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
    analysisFile?: string;
    hasRequirementAnalysis: boolean;
    hasBoundaryAnalysis: boolean;
    hasTechnicalPlan: boolean;
    hasRiskAssessment: boolean;
    userConfirmed: boolean;
    isComplexTask: boolean;
    agentsParticipated: number;
    validAgents: string[];
    requiredAgents: string[];
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
  const harnessOutputDir = path.join(projectRoot, '.harness', 'output');

  // 读取任务文件
  if (!fs.existsSync(taskFilePath)) {
    result.message = 'ℹ️ 未找到 TASK.md，跳过任务分析检查';
    return result;
  }

  const taskContent = fs.readFileSync(taskFilePath, 'utf-8');

  // 1. 分析任务复杂度（统一逻辑）
  const { isComplex, reasons } = analyzeTaskComplexity(taskContent);

  // 2. 获取必需的角色
  const requiredRoles = getRequiredRolesForTask(taskContent);

  // 查找可能存放分析笔记的位置
  const possibleAnalysisFiles = [
    path.join(harnessOutputDir, 'task-analysis.md'),
    path.join(harnessOutputDir, 'analysis-notes.md'),
    path.join(harnessOutputDir, 'requirement-analysis.md'),
    path.join(harnessOutputDir, 'TASK.md')
  ];

  // 扫描 output 目录下所有 analysis-*.md 文件
  if (fs.existsSync(harnessOutputDir)) {
    const files = fs.readdirSync(harnessOutputDir);
    for (const file of files) {
      if (file.startsWith('analysis-') && file.endsWith('.md')) {
        const filePath = path.join(harnessOutputDir, file);
        if (!possibleAnalysisFiles.includes(filePath)) {
          possibleAnalysisFiles.push(filePath);
        }
      }
    }
  }

  let analysisDoc = {
    exists: false,
    path: '',
    content: '',
    hasSection: (section: string) => false
  };

  for (const filePath of possibleAnalysisFiles) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      analysisDoc = {
        exists: true,
        path: filePath,
        content,
        hasSection: (section: string) => {
          const patterns = [
            new RegExp(`##\\s*${section}`, 'i'),
            new RegExp(`###\\s*${section}`, 'i'),
            new RegExp(`\\*\\*${section}\\*\\*`, 'i'),
            new RegExp(`${section} [:：]`, 'i'),
            new RegExp(`^${section}[:：]`, 'im')
          ];
          return patterns.some(pattern => pattern.test(content));
        }
      };
      break;
    }
  }

  if (!analysisDoc.exists) {
    result.passed = false;
    result.errors.push('未找到任务分析文档');
    result.message = '【阻塞】未找到任务分析文档，请先完成需求分析';
    return result;
  }

  // 检查 1: 需求理解
  const requirementKeywords = ['需求', 'requirement', '目标', 'goal', '用户需要', '功能', '需要实现'];
  const hasRequirementAnalysis =
    analysisDoc.hasSection('需求理解') ||
    analysisDoc.hasSection('需求分析') ||
    requirementKeywords.some(k => analysisDoc.content.includes(k));

  if (!hasRequirementAnalysis) {
    result.errors.push('缺少需求分析：未识别到需求理解相关内容');
  }

  // 检查 2: 边界条件分析
  const boundaryKeywords = ['边界', 'boundary', '限制', 'constraint', '范围', 'scope', '不涉及', '不包含'];
  const hasBoundaryAnalysis =
    analysisDoc.hasSection('边界条件') ||
    analysisDoc.hasSection('边界分析') ||
    boundaryKeywords.some(k => analysisDoc.content.includes(k));

  if (!hasBoundaryAnalysis) {
    result.errors.push('缺少边界分析：未识别到边界条件相关内容');
  }

  // 检查 3: 技术方案
  const techPlanKeywords = ['技术方案', 'scheme', 'plan', '设计', 'design', '实现方式', '架构', '使用', '采用'];
  const hasTechnicalPlan =
    analysisDoc.hasSection('技术方案') ||
    analysisDoc.hasSection('设计方案') ||
    techPlanKeywords.some(k => analysisDoc.content.includes(k));

  if (!hasTechnicalPlan) {
    result.errors.push('缺少技术方案：未识别到技术方案相关内容');
  }

  // 检查 4: 风险评估
  const riskKeywords = ['风险', 'risk', '注意', 'warning', '问题', 'challenge', '难点'];
  const hasRiskAssessment =
    analysisDoc.hasSection('风险评估') ||
    analysisDoc.hasSection('风险分析') ||
    riskKeywords.some(k => analysisDoc.content.includes(k));

  if (!hasRiskAssessment) {
    result.warnings.push('建议添加风险评估：未识别到风险分析相关内容');
  }

  // 检查 5: 用户确认标记
  const userConfirmKeywords = ['用户确认', 'confirmed', '已确认', '同意', 'approved', '用户说', '用户表示'];
  const hasUserConfirm =
    analysisDoc.hasSection('用户确认') ||
    userConfirmKeywords.some(k => analysisDoc.content.includes(k));

  // 检查 6: 多 Agent 参与（复杂任务强制要求）
  const { validAgents, invalidAgents, totalWordCount } =
    validateMultipleAgents(agentMemoryDir, requiredRoles);

  // 复杂任务强制要求至少 2 个有效 Agent 参与
  if (isComplex && validAgents.length < 2) {
    result.passed = false;
    const participationErrors = invalidAgents.map(a => `${a.name}: ${a.errors.join(', ')}`).join('; ');
    result.errors.push(`复杂任务需要多 Agent 协作：当前仅 ${validAgents.length} 个有效 Agent 参与，需要至少 2 个`);
    if (participationErrors) {
      result.errors.push(`无效参与：${participationErrors}`);
    }
  }

  // 检查必需角色是否参与
  const missingRequiredRoles = requiredRoles.filter(role =>
    !validAgents.some(agent => agent.toLowerCase().includes(role.toLowerCase()))
  );

  if (isComplex && missingRequiredRoles.length > 0) {
    result.passed = false;
    result.errors.push(`缺少必需角色的 Agent: ${missingRequiredRoles.join('、')}`);
  }

  // 综合判断
  const criticalChecks = [
    hasRequirementAnalysis,
    hasBoundaryAnalysis,
    hasTechnicalPlan,
    isComplex ? validAgents.length >= 2 : true,  // 复杂任务必须有多 Agent 参与
    isComplex && missingRequiredRoles.length > 0 ? false : true  // 必需角色必须参与
  ];
  const allCriticalPassed = criticalChecks.every(check => check);

  if (!allCriticalPassed) {
    result.passed = false;
    result.message = '【阻塞】任务分析不完整，请补充以下内容后再开始编码:\n' +
      (hasRequirementAnalysis ? '✅ 需求分析' : '❌ 需求分析') + '\n' +
      (hasBoundaryAnalysis ? '✅ 边界分析' : '❌ 边界分析') + '\n' +
      (hasTechnicalPlan ? '✅ 技术方案' : '❌ 技术方案') +
      (isComplex ? `\n${validAgents.length >= 2 ? '✅' : '❌'} 多 Agent 协作（${validAgents.length}/2 个有效 Agent 参与，${totalWordCount} 字）` : '') +
      (missingRequiredRoles.length > 0 ? `\n❌ 必需角色缺失（${missingRequiredRoles.join('、')}）` : '');

    if (!hasUserConfirm) {
      result.message += '\n\n⚠️ 建议添加用户确认记录';
    }

    return result;
  }

  // 全部检查通过
  result.data = {
    analysisFile: analysisDoc.path,
    hasRequirementAnalysis,
    hasBoundaryAnalysis,
    hasTechnicalPlan,
    hasRiskAssessment,
    userConfirmed: hasUserConfirm,
    isComplexTask: isComplex,
    agentsParticipated: validAgents.length,
    validAgents,
    requiredAgents: requiredRoles
  };

  result.message = `✅ 任务分析检查通过` +
    `\n - 任务类型：${isComplex ? '复杂任务（需要多 Agent 协作）' : '简单任务'}` +
    (isComplex ? `\n - 需要原因：${reasons.join('; ')}` : '') +
    `\n - 需求分析：${hasRequirementAnalysis ? '✅' : '❌'}` +
    `\n - 边界分析：${hasBoundaryAnalysis ? '✅' : '❌'}` +
    `\n - 技术方案：${hasTechnicalPlan ? '✅' : '❌'}` +
    `\n - 风险评估：${hasRiskAssessment ? '✅' : '⚠️'}` +
    `\n - 用户确认：${hasUserConfirm ? '✅' : '⚠️'}` +
    (isComplex ? `\n - 参与 Agent: ${validAgents.join('、')} (${totalWordCount} 字)` : '') +
    (isComplex ? `\n - 必需角色：${requiredRoles.join('、')}` : '');

  if (result.warnings.length > 0) {
    result.message += '\n\n警告:\n' + result.warnings.join('\n');
  }

  // 输出日志
  const logFile = path.join(projectRoot, '.harness', 'output', 'task-analysis.log');
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

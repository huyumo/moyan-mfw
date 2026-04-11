/**
 * 会话结束检查 Hook
 *
 * 目的：确保会话结束时 AI 已经完成了工作总结、任务更新和记忆保存检查
 *
 * 检查项：
 * 1. 是否总结了本次会话完成的工作
 * 2. 是否更新了 TASK.md
 * 3. 是否记录了下一步行动
 * 4. 是否有记忆保存检查
 * 5. 是否有自我反思记录
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
    hasWorkSummary: boolean;
    taskFileUpdated: boolean;
    hasNextSteps: boolean;
    hasSelfReflection: boolean;
    memoryCheckCompleted: boolean;
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
 * 向上查找项目根目录（查找包含 .claude 子目录的目录）
 */
function findProjectRoot(): string {
  let currentDir = process.cwd();
  const maxDepth = 5;
  let depth = 0;
  let lastFound = null;

  while (depth < maxDepth) {
    // 查找包含 .claude 子目录的目录（项目根目录）
    if (fs.existsSync(path.join(currentDir, '.claude')) && !currentDir.endsWith('.claude')) {
      lastFound = currentDir;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
    depth++;
  }

  return lastFound || process.cwd();
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
  const harnessOutputDir = path.join(projectRoot, '.harness', 'output');
  const teamConfigPath = path.join(projectRoot, '.claude', 'harness', 'team.json');

  // 加载团队配置（如果存在）
  let teamConfig: Record<string, any> | null = null;
  if (fs.existsSync(teamConfigPath)) {
    teamConfig = JSON.parse(fs.readFileSync(teamConfigPath, 'utf-8'));
  }

  // 检查 1: 检查是否有工作总结
  const workSummaryFile = path.join(harnessOutputDir, 'work-summary.md');
  const hasWorkSummary = fs.existsSync(workSummaryFile);

  if (!hasWorkSummary) {
    result.warnings.push('⚠️ 未找到工作总结，建议在会话结束前总结本次完成的工作');
  }

  // 检查 2: 检查 TASK.md 是否已更新
  let taskFileUpdated = false;
  let hasNextSteps = false;

  if (fs.existsSync(taskFilePath)) {
    const taskContent = fs.readFileSync(taskFilePath, 'utf-8');

    // 检查是否有"已完成"标记
    const hasCompletedItems = /\[x\]/i.test(taskContent) ||
                              taskContent.includes('## 已完成') ||
                              taskContent.includes('本次会话完成');

    // 检查是否有"下一步行动"
    hasNextSteps = taskContent.includes('下一步') ||
                   taskContent.includes('Next') ||
                   taskContent.includes('待开始') ||
                   taskContent.includes('后续');

    // 检查 YAML 中的 updated 字段是否是今天
    const frontMatterMatch = taskContent.match(/^---\n([\s\S]*?)\n---/);
    if (frontMatterMatch) {
      const frontMatter = parseFrontMatter(frontMatterMatch[1]);
      const today = new Date().toISOString().split('T')[0];
      const updatedDate = frontMatter.updated?.split(' ')[0];

      if (updatedDate === today) {
        taskFileUpdated = true;
      } else if (!frontMatter.updated) {
        result.errors.push('TASK.md 缺少 updated 字段');
      } else {
        result.warnings.push(`⚠️ TASK.md 的 updated 字段可能不是最新（当前值：${frontMatter.updated}）`);
      }
    }

    if (!hasCompletedItems) {
      result.warnings.push('⚠️ TASK.md 中未找到"已完成"标记，建议更新任务状态');
    }

    if (!hasNextSteps) {
      result.warnings.push('⚠️ TASK.md 中未记录"下一步行动"，建议补充');
    }
  } else {
    result.errors.push('TASK.md 文件不存在');
  }

  // 检查 3: 检查自我反思记录
  const selfReflectionFile = path.join(harnessOutputDir, 'self-reflection.md');
  const hasSelfReflection = fs.existsSync(selfReflectionFile);

  if (!hasSelfReflection) {
    result.warnings.push('⚠️ 未找到自我反思记录，建议在会话结束前进行反思');
  }

  // 检查 4: 检查记忆保存检查
  const memoryCheckFile = path.join(harnessOutputDir, 'memory-check.md');
  let hasMemoryCheck = fs.existsSync(memoryCheckFile);

  // 也可以检查 TASK.md 中是否有记忆保存相关记录
  if (!hasMemoryCheck && fs.existsSync(taskFilePath)) {
    const taskContent = fs.readFileSync(taskFilePath, 'utf-8');
    hasMemoryCheck = taskContent.includes('记忆') || taskContent.includes('memory');
  }

  if (!hasMemoryCheck) {
    result.warnings.push('⚠️ 未进行记忆保存检查，建议检查是否有需要保存的内容');
  }

  // 检查 5: 开发 - 测试循环状态检查（新增）
  const taskFlowConfig = teamConfig?.taskFlow;
  if (taskFlowConfig?.devQaLoopEnabled) {
    if (fs.existsSync(taskFilePath)) {
      const taskContent = fs.readFileSync(taskFilePath, 'utf-8');
      const frontMatterMatch = taskContent.match(/^---\n([\s\S]*?)\n---/);

      if (frontMatterMatch) {
        const frontMatter = parseFrontMatter(frontMatterMatch[1]);
        const status = frontMatter.status;

        // 检查任务状态流转是否符合预期
        const validStates = ['pending', 'in_progress', 'awaiting_qa', 'qa_approved', 'rejected', 'completed'];

        if (status && !validStates.includes(status)) {
          result.warnings.push(`⚠️ 任务状态 "${status}" 不是标准状态，建议使用：${validStates.join(', ')}`);
        }

        // 如果状态是 awaiting_qa，提醒 QA 需要审查
        if (status === 'awaiting_qa') {
          result.warnings.push('⚠️ 任务状态为 awaiting_qa - 等待 QA 审查');
        }

        // 如果状态是 rejected，提醒开发需要修复
        if (status === 'rejected') {
          result.warnings.push('⚠️ 任务状态为 rejected - 需要开发修复缺陷');
        }

        // 如果状态是 qa_approved，提醒 QA 需要提交代码
        if (status === 'qa_approved') {
          result.errors.push('❌ 任务状态为 qa_approved - QA 应该提交代码，而不是直接结束会话');
          result.passed = false;
        }
      }
    }
  }

  // 检查 6: 代码审查流程检查（增强版 - 支持打回修改）
  const codeReviewConfig = teamConfig?.collaboration?.codeReview;
  if (codeReviewConfig?.enabled) {
    // 检查是否有审查者指定
    if (fs.existsSync(taskFilePath)) {
      const taskContent = fs.readFileSync(taskFilePath, 'utf-8');
      const frontMatterMatch = taskContent.match(/^---\n([\s\S]*?)\n---/);

      if (frontMatterMatch) {
        const frontMatter = parseFrontMatter(frontMatterMatch[1]);

        // 检查是否有 reviewers
        if (codeReviewConfig.requireReviewBeforeMerge && !frontMatter.reviewers) {
          result.warnings.push('⚠️ 配置要求代码审查，但未指定审查者 (reviewers)');
        }

        // 检查审查记录
        if (codeReviewConfig.requireReviewBeforeMerge) {
          const reviewFile = path.join(harnessOutputDir, 'code-review.md');
          const hasReviewRecord = fs.existsSync(reviewFile);

          if (!hasReviewRecord && frontMatter.status === 'completed') {
            result.warnings.push('⚠️ 任务已完成，但未找到代码审查记录');
          }

          // 检查审查结论（新增 - 打回修改流程）
          if (hasReviewRecord) {
            const reviewContent = fs.readFileSync(reviewFile, 'utf-8');
            const reviewStatus = frontMatter.reviewStatus || 'pending';

            // 审查状态定义：
            // - pending: 待审查
            // - revision_required: 需要修改（打回）
            // - approved: 已通过

            if (reviewStatus === 'revision_required') {
              // 检查是否有"必须修复"的问题
              const mustFixPattern = /### ❌ 必须修复 [\s\S]*?(\d+\.\s*.+)/i;
              const hasMustFixIssues = mustFixPattern.test(reviewContent);

              // 检查是否有开发者回复记录
              const devReplyPattern = /### 开发者回复/i;
              const hasDevReply = devReplyPattern.test(reviewContent);

              if (hasMustFixIssues && !hasDevReply) {
                result.errors.push('❌ 代码审查未通过 - 有需要修复的问题，但开发者尚未回复/修改');
                result.passed = false;
              } else if (hasMustFixIssues && hasDevReply) {
                // 检查是否所有必须修复的问题都已标记为完成
                const fixedPattern = /\*\*已修复的问题\*\*[:\s]*\n([\s\S]*?)(?=\*\*|$)/i;
                const fixedMatch = reviewContent.match(fixedPattern);
                const mustFixMatch = reviewContent.match(mustFixPattern);

                if (fixedMatch && mustFixMatch) {
                  const fixedCount = (fixedMatch[1].match(/\[x\]/g) || []).length;
                  const mustFixCount = (mustFixMatch[1].match(/\d+\./g) || []).length;

                  if (fixedCount < mustFixCount) {
                    result.errors.push(`❌ 代码审查：还有 ${mustFixCount - fixedCount} 个必须修复的问题未完成`);
                    result.passed = false;
                  } else {
                    result.warnings.push('⚠️ 开发者已修复所有问题，需要审查者确认');
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // 综合判断
  const criticalErrors = result.errors.filter(e => !e.includes('可能'));
  if (criticalErrors.length > 0) {
    result.passed = false;
    result.message = '【阻塞】会话结束检查失败:\n' + criticalErrors.join('\n');
    return result;
  }

  // 计算警告数量
  const warningCount = result.warnings.length;

  if (warningCount >= 3) {
    result.passed = false;
    result.message = '【阻塞】会话结束检查失败 - 太多未完成项:\n' +
      ` - 工作总结：${hasWorkSummary ? '✅' : '❌'}` +
      `\n - TASK.md 更新：${taskFileUpdated ? '✅' : '❌'}` +
      `\n - 下一步行动：${hasNextSteps ? '✅' : '❌'}` +
      `\n - 自我反思：${hasSelfReflection ? '✅' : '❌'}` +
      `\n - 记忆检查：${hasMemoryCheck ? '✅' : '❌'}`;
    return result;
  }

  result.data = {
    hasWorkSummary,
    taskFileUpdated,
    hasNextSteps,
    hasSelfReflection,
    memoryCheckCompleted: hasMemoryCheck
  };

  result.message = '✅ 会话结束检查通过';

  if (warningCount > 0) {
    result.message += `\n\n警告 (${warningCount} 项):\n` + result.warnings.join('\n');
  }

  // 输出日志
  const logFile = path.join(projectRoot, '.claude', 'harness', 'output', 'session-end.log');
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

/**
 * 代码质量门禁 Hook
 *
 * 目的：确�?AI 编写的代码通过类型检查、Lint 检查和自测
 *
 * 检查项�? * 1. TypeScript 类型检查（�?any，类型完整）
 * 2. 代码是否通过项目 typecheck
 * 3. 是否有自测记�? * 4. 是否有自我反思记�? * 5. 检查代码冗余度
 *
 * @returns {Promise<HookResult>}
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface HookResult {
  passed: boolean;
  message: string;
  warnings: string[];
  errors: string[];
  data?: {
    typeCheckPassed: boolean;
    selfTestPassed: boolean;
    selfReviewCompleted: boolean;
    filesModified: string[];
    qaApprovalStatus?: string;
    qaApproved?: boolean;
  };
}

/**
 * 子项目信息接�? */
interface SubProject {
  name: string;
  path: string;
  hasTypeScript: boolean;
  hasVue: boolean;
}

/**
 * 动态检测子项目
 * 扫描项目根目录下包含 package.json �?src/ 目录的子目录
 */
function detectSubProjects(projectRoot: string): SubProject[] {
  const subProjects: SubProject[] = [];

  try {
    const entries = fs.readdirSync(projectRoot, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      const subDir = path.join(projectRoot, entry.name);
      const packageJsonPath = path.join(subDir, 'package.json');
      const srcDir = path.join(subDir, 'src');

      // 检查是否是有效子项目：�?package.json �?src 目录
      if (fs.existsSync(packageJsonPath) && fs.existsSync(srcDir)) {
        const nodeModulesBin = path.join(subDir, 'node_modules', '.bin');
        const hasTsc = fs.existsSync(path.join(nodeModulesBin, 'tsc'));
        const hasVueTsc = fs.existsSync(path.join(nodeModulesBin, 'vue-tsc'));
        const hasTsConfig = fs.existsSync(path.join(subDir, 'tsconfig.json'));

        subProjects.push({
          name: entry.name,
          path: subDir,
          hasTypeScript: hasTsc || hasTsConfig,
          hasVue: hasVueTsc
        });
      }
    }
  } catch (e) {
    // 忽略扫描错误
  }

  return subProjects;
}

/**
 * 向上查找项目根目录（查找 TASK.md 文件�? */
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
 * 检�?QA 审批状�? * 读取 TASK.md 中的任务状态，确认是否�?qa_approved
 */
function checkQAApproval(projectRoot: string): { approved: boolean; status?: string; error?: string } {
  const taskFilePath = path.join(projectRoot, 'TASK.md');

  if (!fs.existsSync(taskFilePath)) {
    return { approved: false, error: '未找�?TASK.md 文件' };
  }

  const content = fs.readFileSync(taskFilePath, 'utf-8');

  // 解析 YAML Front Matter
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontMatterMatch) {
    return { approved: false, error: 'TASK.md 格式错误：缺�?Front Matter' };
  }

  const frontMatterRaw: Record<string, string> = {};
  const lines = frontMatterMatch[1].split('\n');
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      frontMatterRaw[match[1]] = match[2].trim();
    }
  }

  const status = frontMatterRaw['status'];

  // 检查状态是否为 qa_approved
  if (status === 'qa_approved') {
    return { approved: true, status };
  }

  // 如果�?completed 状态，也允许（QA 提交后的状态）
  if (status === 'completed') {
    return { approved: true, status };
  }

  return {
    approved: false,
    status: status || 'unknown',
    error: `任务状态为 "${status}"，必须是 "qa_approved" �?"completed" 才能提交`
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
  const harnessOutputDir = path.join(projectRoot, '.harness', 'output');

  // 检�?1: 查找最近修改的文件（通过输出目录的记录）
  const modifiedFilesLog = path.join(harnessOutputDir, 'modified-files.log');
  let modifiedFiles: string[] = [];

  if (fs.existsSync(modifiedFilesLog)) {
    const content = fs.readFileSync(modifiedFilesLog, 'utf-8');
    modifiedFiles = content.split('\n').filter(line => line.trim());
  }

  // 检�?2: TypeScript 类型检�?  let typeCheckPassed = false;
  let typeCheckOutput = '';
  let typeCheckError = '';

  try {
    // 策略 1: 尝试运行项目�?typecheck 命令
    const typecheckCommands = [
      'pnpm run typecheck',
      'npm run typecheck',
      'yarn typecheck',
      'pnpm run type-check',
      'npm run type-check',
      'pnpm run check:types',
      'npm run check:types'
    ];

    for (const cmd of typecheckCommands) {
      try {
        typeCheckOutput = execSync(cmd, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 60000,
          cwd: projectRoot
        });
        typeCheckPassed = true;
        break;
      } catch (e) {
        const err = e as { stderr?: string; stdout?: string; status?: number };
        typeCheckOutput = err.stderr || err.stdout || '';
        typeCheckError = typeCheckOutput;
        // 继续尝试下一个命�?      }
    }

    // 如果所�?typecheck 命令都失败，尝试直接使用 tsc（从项目 node_modules�?    if (!typeCheckPassed) {
      try {
        // 尝试使用项目本地�?TypeScript
        const localTsc = path.join(projectRoot, 'node_modules', '.bin', 'tsc');

        // 如果根目录没有，尝试检测到的子项目
        let tscPath = localTsc;
        if (!fs.existsSync(localTsc)) {
          const subProjects = detectSubProjects(projectRoot);
          for (const sub of subProjects) {
            const subTsc = path.join(sub.path, 'node_modules', '.bin', 'tsc');
            if (fs.existsSync(subTsc)) {
              tscPath = subTsc;
              break;
            }
          }
        }

        typeCheckOutput = execSync(`"${tscPath}" --noEmit`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 60000,
          cwd: projectRoot
        });
        typeCheckPassed = true;
        typeCheckError = '';
      } catch (e) {
        const err = e as { stderr?: string; stdout?: string; status?: number };
        typeCheckOutput = err.stderr || err.stdout || '';
        typeCheckError = typeCheckOutput;
      }
    }

    // 如果还是失败，尝试使�?vue-tsc（针�?Vue 项目�?    if (!typeCheckPassed && !typeCheckError.includes('This is not the tsc command')) {
      try {
        const subProjects = detectSubProjects(projectRoot);
        const vueProject = subProjects.find(sub => sub.hasVue);

        if (vueProject) {
          const vueTscPath = path.join(vueProject.path, 'node_modules', '.bin', 'vue-tsc');

          if (fs.existsSync(vueTscPath)) {
            // 在子项目目录下运�?vue-tsc
            typeCheckOutput = execSync(`"${vueTscPath}" --noEmit --skipLibCheck`, {
              encoding: 'utf-8',
              stdio: ['pipe', 'pipe', 'pipe'],
              timeout: 120000,
              cwd: vueProject.path
            });
            typeCheckPassed = true;
            typeCheckError = '';
          }
        }
      } catch (e) {
        const err = e as { stderr?: string; stdout?: string; status?: number };
        typeCheckOutput = err.stderr || err.stdout || '';
        typeCheckError = typeCheckOutput;
      }
    }

    // 报告类型检查结�?    if (!typeCheckPassed) {
      // 提取错误信息的前 10 �?      const errorLines = typeCheckOutput.split('\n').slice(0, 10);
      result.errors.push(
        `类型检查失�?\n${errorLines.join('\n')}`
      );
      result.passed = false;
    }
  } catch (e) {
    result.errors.push(`类型检查执行异常：${(e as Error).message}`);
    result.passed = false;
  }

  // 检�?3: 检查自测记录（支持子项目目录）- 增强�?  // 不仅检查文件存在，还要验证测试是否实际执行
  // 动态检测子项目并构建自测报告路径列�?  const subProjects = detectSubProjects(projectRoot);
  const selfTestFiles = [path.join(harnessOutputDir, 'self-test-report.md')];

  // 为每个子项目添加自测报告路径
  for (const sub of subProjects) {
    selfTestFiles.push(
      path.join(sub.path, '.harness', 'output', 'self-test-report.md')
    );
  }

  const selfTestResults: { path: string; exists: boolean; projectName: string }[] = [];

  for (const file of selfTestFiles) {
    selfTestResults.push({
      path: file,
      exists: fs.existsSync(file),
      projectName: path.basename(path.dirname(path.dirname(path.dirname(file))))
    });
  }

  const hasSelfTest = selfTestResults.some(r => r.exists);

  if (!hasSelfTest) {
    result.errors.push('�?未找到自测报告，必须记录测试结果');
    result.passed = false;
  } else {
    // 验证自测报告内容 - 增强版：检查实际执行证�?    // 遍历所有存在的自测报告进行验证
    for (const testResult of selfTestResults.filter(r => r.exists)) {
      const content = fs.readFileSync(testResult.path, 'utf-8');
      const projectLabel = testResult.projectName || '项目';

      // 检�?1: 是否有关键词
      const hasKeywords = content.includes('�?) || content.includes('通过') || content.includes('PASS');
      if (!hasKeywords) {
        result.errors.push(`�?${projectLabel}自测报告未记录明确的测试结果`);
        result.passed = false;
      }

      // 检�?2: 是否有实际执行证据（测试日志、时间戳、具体输出）
      const hasExecutionEvidence =
        content.includes('Test Files') ||  // vitest 输出
        content.includes('Duration') ||     // 执行时间
        content.includes('$ npx') ||        // 命令执行
        content.includes('RUN  v') ||       // vitest 版本
        content.includes('�?__tests__') ||  // 测试文件执行
        content.includes('�?');             // 测试通过标记

      if (!hasExecutionEvidence) {
        result.errors.push(`�?${projectLabel}自测报告缺少实际执行证据（测试日志、时间戳等）`);
        result.passed = false;
      }

      // 检�?3: 是否�?开发中"�?未完�?�?TODO"等标�?      const pendingPatterns = ['开发中', '未完�?, '待实�?, 'TODO', 'FIXME', '待执�?];
      for (const pattern of pendingPatterns) {
        if (content.includes(pattern)) {
          result.errors.push(`�?${projectLabel}自测报告包含"${pattern}"标记，功能未完成不能交付`);
          result.passed = false;
        }
      }
    }
  }

  // 检�?4: 检查自我反思记�?  const selfReviewFile = path.join(harnessOutputDir, 'self-review.md');
  const hasSelfReview = fs.existsSync(selfReviewFile);

  if (!hasSelfReview) {
    result.warnings.push('⚠️ 未找到自我反思记录，建议进行代码审查');
  }

  // 检�?5: E2E 测试验证（新�?- 强制浏览器测试）
  // 动态构�?E2E 测试目录列表
  const e2eTestDirs = [
    path.join(projectRoot, 'tests'),
    path.join(projectRoot, 'e2e')
  ];

  // 为每个子项目添加 E2E 测试目录
  for (const sub of subProjects) {
    e2eTestDirs.push(path.join(sub.path, 'tests'));
    e2eTestDirs.push(path.join(sub.path, 'e2e'));
  }

  let e2eTestDir = '';
  for (const dir of e2eTestDirs) {
    if (fs.existsSync(dir)) {
      const playwrightConfig = path.join(dir, 'playwright.config.ts');
      const playwrightConfigJs = path.join(dir, 'playwright.config.js');
      if (fs.existsSync(playwrightConfig) || fs.existsSync(playwrightConfigJs)) {
        e2eTestDir = dir;
        break;
      }
    }
  }

  if (e2eTestDir) {
    // 检�?E2E 测试是否实际执行�?    const e2eEvidenceFiles = [
      path.join(e2eTestDir, 'playwright-report'),
      path.join(e2eTestDir, 'test-results'),
      path.join(e2eTestDir, 'reports', 'html'),
      path.join(e2eTestDir, 'reports', 'test-results.json'),
      path.join(e2eTestDir, 'screenshots')
    ];

    let hasE2eEvidence = false;
    for (const evidenceFile of e2eEvidenceFiles) {
      if (fs.existsSync(evidenceFile)) {
        hasE2eEvidence = true;
        break;
      }
    }

    if (!hasE2eEvidence) {
      result.errors.push('�?检测到 E2E 测试框架（Playwright），但未找到实际执行证据');
      result.errors.push('   请运�?E2E 测试并生成报告（playwright-report �?test-results 目录�?);
      result.passed = false;
    }
  }

  // 检�?6: 功能完成度检�?- 扫描代码中的"开发中"等标�?  // 动态构建源代码目录列表
  const sourceDirs = [path.join(projectRoot, 'src')];

  // 为每个子项目添加源代码目�?  for (const sub of subProjects) {
    sourceDirs.push(path.join(sub.path, 'src'));
  }

  const incompletePatterns = [
    { pattern: /开发中/gi, label: '开发中' },
    { pattern: /未完�?gi, label: '未完�? },
    { pattern: /待实�?gi, label: '待实�? },
    { pattern: /TODO(?!.*完成)/gi, label: 'TODO' },
    { pattern: /FIXME/gi, label: 'FIXME' }
  ];

  const incompleteFiles: { file: string; marker: string }[] = [];

  for (const srcDir of sourceDirs) {
    if (fs.existsSync(srcDir)) {
      const scanDirectory = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            scanDirectory(fullPath);
          } else if (entry.isFile() && /\.(ts|tsx|js|jsx|vue|svelte)$/.test(entry.name)) {
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              for (const { pattern, label } of incompletePatterns) {
                if (pattern.test(content)) {
                  incompleteFiles.push({
                    file: path.relative(projectRoot, fullPath),
                    marker: label
                  });
                }
              }
            } catch (e) {
              // 忽略文件读取错误
            }
          }
        }
      };
      scanDirectory(srcDir);
    }
  }

  if (incompleteFiles.length > 0) {
    result.errors.push(`�?检测到 ${incompleteFiles.length} 个文件包含未完成标记:`);
    incompleteFiles.slice(0, 10).forEach(({ file, marker }) => {
      result.errors.push(`   - ${file} (${marker})`);
    });
    if (incompleteFiles.length > 10) {
      result.errors.push(`   ... 还有 ${incompleteFiles.length - 10} 个文件`);
    }
    result.passed = false;
  }

  // 检�?5: 检查代码中是否有明显的 TODO/FIXME 标记（新添加的）
  if (modifiedFiles.length > 0) {
    let hasPendingTodos = false;

    for (const file of modifiedFiles) {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          // 检查是否有未完成的 TODO
          if (/TODO(?!.*完成)/i.test(content) || /FIXME/i.test(content)) {
            hasPendingTodos = true;
            result.warnings.push(`⚠️ ${path.relative(projectRoot, file)} 中包�?TODO/FIXME`);
          }
        } catch (e) {
          // 忽略
        }
      }
    }

    if (hasPendingTodos) {
      result.warnings.push('// TODO-TASK-2026-04-11-001: 建议完成所�?TODO 标记的工作后再提�?);
    }
  }

  // 检�?6: QA 审批状态检查（新增 - 开发测试循环强制要求）
  const qaCheckResult = checkQAApproval(projectRoot);
  const qaApproved = qaCheckResult.approved;

  if (!qaApproved) {
    result.errors.push(`�?QA 审批未通过�?{qaCheckResult.error}`);
    result.errors.push('   开发完成后必须经过 QA 测试通过才能提交代码');
    result.errors.push('   当前任务状态：' + (qaCheckResult.status || 'unknown'));
    result.passed = false;
  }

  // 综合判断
  if (!typeCheckPassed && typeCheckError) {
    result.passed = false;
    result.message = '【阻塞】代码质量检查失�?- 类型检查未通过';
    return result;
  }

  // QA 审批是强制检查项
  if (!qaApproved) {
    result.passed = false;
    result.message = '【阻塞】代码质量检查失�?- QA 未审批通过';
    return result;
  }

  result.data = {
    typeCheckPassed: typeCheckPassed || result.warnings.some(w => w.includes('类型检查执行异�?)),
    selfTestPassed: hasSelfTest,
    selfReviewCompleted: hasSelfReview,
    filesModified: modifiedFiles.slice(0, 10),
    qaApprovalStatus: qaCheckResult.status,
    qaApproved: qaApproved
  };

  result.message = '�?代码质量检查通过';

  if (result.warnings.length > 0) {
    result.message += '\n\n警告:\n' + result.warnings.join('\n');
  }

  // 输出日志
  const logFile = path.join(projectRoot, '.harness', 'output', 'code-quality-gate.log');
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
        message: `钩子执行失败�?{error.message}`,
        errors: [error.message],
        warnings: []
      }, null, 2));
      process.exit(1);
    });
}

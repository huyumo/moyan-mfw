/**
 * Harness 统一运行器
 *
 * 用途：根据传入的 hook 名称运行对应的钩子脚本
 *
 * 使用方式：
 *   npx tsx scripts/harness-runner.ts session-start
 *   npx tsx scripts/harness-runner.ts task-analysis
 *   npx tsx scripts/harness-runner.ts pre-code
 *   npx tsx scripts/harness-runner.ts code-quality-gate
 *   npx tsx scripts/harness-runner.ts session-end
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const HOOK_MAP: Record<string, string> = {
  'session-start': 'hooks/session-start-hook.ts',
  'task-analysis': 'hooks/task-analysis-hook.ts',
  'pre-code': 'hooks/pre-code-hook.ts',
  'code-quality-gate': 'hooks/code-quality-gate.ts',
  'session-end': 'hooks/session-end-hook.ts'
};

interface HookResult {
  passed: boolean;
  message: string;
  warnings: string[];
  errors: string[];
}

async function runHook(hookName: string): Promise<HookResult> {
  const hookPath = HOOK_MAP[hookName];

  if (!hookPath) {
    return {
      passed: false,
      message: `未知的 Hook 名称：${hookName}`,
      errors: [`未知的 Hook 名称：${hookName}`],
      warnings: []
    };
  }

  const scriptPath = path.join(process.cwd(), '.claude', 'harness', hookPath);

  if (!fs.existsSync(scriptPath)) {
    return {
      passed: false,
      message: `Hook 脚本不存在：${scriptPath}`,
      errors: [`Hook 脚本不存在：${scriptPath}`],
      warnings: []
    };
  }

  try {
    const output = execSync(`npx tsx "${scriptPath}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 60000,
      cwd: process.cwd()
    });

    return JSON.parse(output) as HookResult;
  } catch (e) {
    const err = e as { stderr?: string; stdout?: string };
    const output = err.stderr || err.stdout || '';

    try {
      // 尝试解析 JSON 输出
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as HookResult;
      }
    } catch {
      // 解析失败，返回原始输出
    }

    return {
      passed: false,
      message: `Hook 执行失败：${e}`,
      errors: [output || (e as Error).message],
      warnings: []
    };
  }
}

async function runAllHooks(): Promise<Record<string, HookResult>> {
  const results: Record<string, HookResult> = {};

  for (const hookName of Object.keys(HOOK_MAP)) {
    console.log(`\n>>> 运行 Hook: ${hookName}`);
    results[hookName] = await runHook(hookName);
  }

  return results;
}

// CLI 入口
const args = process.argv.slice(2);

if (args[0] === '--all') {
  // 运行所有 hooks
  runAllHooks()
    .then(results => {
      console.log('\n========== 所有 Hooks 运行结果 ==========');
      for (const [name, result] of Object.entries(results)) {
        console.log(`\n${name}: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`  消息：${result.message}`);
        if (result.errors.length > 0) {
          console.log(`  错误：${result.errors.join(', ')}`);
        }
        if (result.warnings.length > 0) {
          console.log(`  警告：${result.warnings.join(', ')}`);
        }
      }

      const hasFailures = Object.values(results).some(r => !r.passed);
      process.exit(hasFailures ? 1 : 0);
    })
    .catch(error => {
      console.error('运行 Hooks 时发生错误:', error);
      process.exit(1);
    });
} else if (args[0]) {
  // 运行单个 hook
  runHook(args[0])
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.passed ? 0 : 1);
    })
    .catch(error => {
      console.error('运行 Hook 时发生错误:', error);
      process.exit(1);
    });
} else {
  console.log(`
Harness 统一运行器

使用方式:
  npx tsx scripts/harness-runner.ts <hook-name>   # 运行单个 hook
  npx tsx scripts/harness-runner.ts --all         # 运行所有 hooks

可用的 hooks:
  - session-start      会话开始检查
  - task-analysis      任务分析检查
  - pre-code           编码前检查
  - code-quality-gate  代码质量门禁
  - session-end        会话结束检查
`);
  process.exit(0);
}

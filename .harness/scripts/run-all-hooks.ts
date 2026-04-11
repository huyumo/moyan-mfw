/**
 * 运行所有 Hooks 脚本
 *
 * 用途：按顺序运行所有钩子，用于验证环境完整性检查
 *
 * 使用方式：
 *   npx tsx scripts/run-all-hooks.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const HOOKS = [
  { name: 'identity-greeting', file: 'hooks/identity-greeting-hook.ts' },
  { name: 'session-start', file: 'hooks/session-start-hook.ts' },
  { name: 'task-analysis', file: 'hooks/task-analysis-hook.ts' },
  { name: 'pre-code', file: 'hooks/pre-code-hook.ts' },
  { name: 'code-quality-gate', file: 'hooks/code-quality-gate.ts' },
  { name: 'session-end', file: 'hooks/session-end-hook.ts' }
];

interface HookResult {
  passed: boolean;
  message: string;
  warnings: string[];
  errors: string[];
}

async function runHook(hookName: string, hookFile: string): Promise<HookResult> {
  // 使用脚本所在目录作为基础路径（支持从项目根目录或 harness 目录运行）
  const scriptDir = path.join(__dirname, '..');
  const scriptPath = path.join(scriptDir, hookFile);

  if (!fs.existsSync(scriptPath)) {
    return {
      passed: false,
      message: `Hook 脚本不存在：${scriptPath}`,
      errors: [`Hook 脚本不存在：${scriptPath} (${hookName})`],
      warnings: []
    };
  }

  try {
    const output = execSync(`npx tsx "${scriptPath}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 120000,
      cwd: process.cwd()
    });

    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as HookResult;
    }

    return {
      passed: false,
      message: `Hook 输出解析失败：${output}`,
      errors: [output],
      warnings: []
    };
  } catch (e) {
    const err = e as { stderr?: string; stdout?: string };
    const output = err.stderr || err.stdout || '';

    try {
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

async function main() {
  console.log('===========================================');
  console.log('  Harness 验证环境 - 运行所有 Hooks');
  console.log('===========================================\n');

  const results: Record<string, HookResult> = {};

  for (const hook of HOOKS) {
    console.log(`\n>>> 运行 Hook: ${hook.name}`);
    console.log(`    文件：${hook.file}`);

    results[hook.name] = await runHook(hook.name, hook.file);

    const status = results[hook.name].passed ? '✅ PASS' : '❌ FAIL';
    console.log(`    结果：${status}`);
    console.log(`    消息：${results[hook.name].message}`);

    if (results[hook.name].errors.length > 0) {
      console.log(`    错误：${results[hook.name].errors.join(', ')}`);
    }
    if (results[hook.name].warnings.length > 0) {
      console.log(`    警告：${results[hook.name].warnings.join(', ')}`);
    }
  }

  // 汇总报告
  console.log('\n===========================================');
  console.log('  汇总报告');
  console.log('===========================================');

  const passCount = Object.values(results).filter(r => r.passed).length;
  const failCount = Object.values(results).filter(r => !r.passed).length;

  console.log(`\n总计：${HOOKS.length} 个 Hooks`);
  console.log(`通过：${passCount}`);
  console.log(`失败：${failCount}`);

  for (const [name, result] of Object.entries(results)) {
    console.log(`\n${name}: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
    if (!result.passed && result.errors.length > 0) {
      console.log(`  错误：${result.errors.join('\n        ')}`);
    }
  }

  if (failCount > 0) {
    console.log('\n\n有 Hooks 失败，请检查上方错误信息。');
    process.exit(1);
  } else {
    console.log('\n\n所有 Hooks 通过验证！');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('运行 Hooks 时发生未捕获错误:', error);
  process.exit(1);
});

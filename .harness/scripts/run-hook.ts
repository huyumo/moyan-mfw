#!/usr/bin/env tsx
/**
 * Hook 执行包装器 - 记录调用日志
 *
 * 用法：tsx run-hook.ts <event> <hook-name> <command>
 *
 * 例如：
 *   tsx run-hook.ts SessionStart hook:identity "pnpm run hook:identity"
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// 获取当前脚本所在目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HARNESS_ROOT = path.resolve(__dirname, '..');
const LOG_FILE = path.join(HARNESS_ROOT, 'output', 'logs', 'hook-calls.log');

function ensureLogDir(): void {
  const logDir = path.dirname(LOG_FILE);
  fs.mkdirSync(logDir, { recursive: true });
}

function getTimestamp(): string {
  return new Date().toISOString();
}

function formatDuration(ms: number): string {
  return `${ms}ms`;
}

function log(event: string, hookName: string, status: string, extra?: string): void {
  const timestamp = getTimestamp();
  const line = `[${timestamp}] [${event.padEnd(15)}] [${hookName.padEnd(25)}] [${status.padEnd(10)}]${extra ? ' ' + extra : ''}`;

  ensureLogDir();
  fs.appendFileSync(LOG_FILE, line + '\n');
  console.error(line);
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error('用法：tsx run-hook.ts <event> <hook-name> <command>');
    console.error('例如：tsx run-hook.ts SessionStart hook:identity "pnpm run hook:identity"');
    process.exit(1);
  }

  const event = args[0];
  const hookName = args[1];
  const command = args.slice(2).join(' ');

  try {
    // 记录开始
    log(event, hookName, 'started');

    // 执行命令
    const startTime = Date.now();
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const duration = Date.now() - startTime;

    // 记录完成
    log(event, hookName, 'completed', formatDuration(duration));

    // 输出 hook 的结果
    if (output && output.trim()) {
      console.log(output);
    }

  } catch (error: any) {
    const duration = Date.now(); // 近似值
    const errorMessage = error.message?.split('\n')[0] || 'unknown error';
    const exitCode = error.status || 'unknown';

    // 记录失败
    log(event, hookName, 'failed', `${formatDuration(duration)} ERROR: ${errorMessage} (exit ${exitCode})`);

    // 输出错误
    console.error(error.stdout?.toString() || error.message);
    process.exit(error.status || 1);
  }
}

main();

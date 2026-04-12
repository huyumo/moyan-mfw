#!/usr/bin/env tsx
/**
 * Hook 调用日志记录器
 *
 * 目的：记录每次 hook 的调用，用于追踪和审计
 *
 * 日志格式：
 * [timestamp] [event] [hook-name] [status] [duration]
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// 获取当前脚本所在目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HARNESS_ROOT = path.resolve(__dirname, '..');
const LOG_FILE = path.join(HARNESS_ROOT, 'output', 'logs', 'hook-calls.log');

interface HookCallLog {
  timestamp: string;
  event: string;       // SessionStart, PreToolUse, PostToolUse, SubagentStart, SubagentStop, SessionEnd
  hookName: string;    // hook:identity, hook:session-start, etc.
  matcher?: string;    // 匹配的 matcher
  status: 'started' | 'completed' | 'failed';
  duration?: number;   // 执行时间 (ms)
  error?: string;
}

/**
 * 记录 hook 调用开始
 */
export function logHookStart(event: string, hookName: string, matcher?: string): void {
  const log: HookCallLog = {
    timestamp: new Date().toISOString(),
    event,
    hookName,
    matcher,
    status: 'started'
  };
  appendLog(log);
}

/**
 * 记录 hook 调用完成
 */
export function logHookComplete(
  event: string,
  hookName: string,
  matcher: string | undefined,
  duration: number
): void {
  const log: HookCallLog = {
    timestamp: new Date().toISOString(),
    event,
    hookName,
    matcher,
    status: 'completed',
    duration
  };
  appendLog(log);
}

/**
 * 记录 hook 调用失败
 */
export function logHookFailed(
  event: string,
  hookName: string,
  matcher: string | undefined,
  error: string
): void {
  const log: HookCallLog = {
    timestamp: new Date().toISOString(),
    event,
    hookName,
    matcher,
    status: 'failed',
    error
  };
  appendLog(log);
}

/**
 * 追加日志到文件
 */
function appendLog(log: HookCallLog): void {
  const logDir = path.dirname(LOG_FILE);
  fs.mkdirSync(logDir, { recursive: true });

  const logLine = formatLogLine(log);
  fs.appendFileSync(LOG_FILE, logLine + '\n');

  // 同时输出到 stdout，以便在终端可见
  console.error(logLine);
}

/**
 * 格式化日志行
 */
function formatLogLine(log: HookCallLog): string {
  const parts = [
    `[${log.timestamp}]`,
    `[${log.event.padEnd(15)}]`,
    `[${log.hookName.padEnd(25)}]`,
    `[${log.status.padEnd(10)}]`,
  ];

  if (log.matcher) {
    parts.push(`{matcher: ${log.matcher}}`);
  }

  if (log.duration !== undefined) {
    parts.push(`${log.duration}ms`);
  }

  if (log.error) {
    parts.push(`ERROR: ${log.error}`);
  }

  return parts.join(' ');
}

/**
 * 获取指定事件的 hook 调用历史
 */
export function getHookHistory(event?: string): HookCallLog[] {
  if (!fs.existsSync(LOG_FILE)) {
    return [];
  }

  const content = fs.readFileSync(LOG_FILE, 'utf-8');
  const lines = content.trim().split('\n').filter(line => line.length > 0);

  return lines.map(line => parseLogLine(line)).filter(log => {
    if (!event) return true;
    return log.event === event;
  });
}

/**
 * 解析日志行
 */
function parseLogLine(line: string): HookCallLog {
  // 解析格式：[timestamp] [event] [hookName] [status] extra
  const match = line.match(/\[([^\]]+)\] \[([^\]]+)\] \[([^\]]+)\] \[([^\]]+)\](.*)/);
  if (!match) {
    return { timestamp: '', event: '', hookName: '', status: 'unknown' as any };
  }
  return {
    timestamp: match[1],
    event: match[2].trim(),
    hookName: match[3].trim(),
    status: match[4].trim() as any,
  };
}

/**
 * 生成 hook 调用摘要报告
 */
export function generateSummary(): string {
  const history = getHookHistory();
  const byEvent = new Map<string, { total: number; completed: number; failed: number }>();

  for (const log of history) {
    if (!byEvent.has(log.event)) {
      byEvent.set(log.event, { total: 0, completed: 0, failed: 0 });
    }
    const stats = byEvent.get(log.event)!;
    stats.total++;
    if (log.status === 'completed') stats.completed++;
    if (log.status === 'failed') stats.failed++;
  }

  let report = '=== Hook 调用摘要 ===\n';
  for (const [event, stats] of byEvent.entries()) {
    report += `\n${event}:\n`;
    report += `  总计：${stats.total}, 完成：${stats.completed}, 失败：${stats.failed}\n`;
  }

  return report;
}

// CLI 入口
const isMain = require.main === module;
if (isMain) {
  const args = process.argv.slice(2);
  if (args[0] === '--summary') {
    console.log(generateSummary());
  } else if (args[0] === '--history') {
    const event = args[1];
    const history = getHookHistory(event);
    console.log(JSON.stringify(history, null, 2));
  } else {
    console.log('用法：tsx hook-call-logger.ts [--summary|--history [event]]');
  }
}

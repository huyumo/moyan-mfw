/**
 * @fileoverview Playwright 全局设置。
 *
 * 启动后端 API 服务，准备测试环境。
 */

import { spawn, ChildProcess, execSync } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';

const BACKEND_PORT = Number(process.env.E2E_BACKEND_PORT || 3000);
const BACKEND_HOST = '127.0.0.1';
const BACKEND_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;
const STARTUP_TIMEOUT = 60_000; // 60 秒超时

let backendProcess: ChildProcess | null = null;

/**
 * 检查端口是否被占用
 */
function isPortInUse(port: number): boolean {
  try {
    const result = execSync(`netstat -ano | findstr :${port}`, {
      encoding: 'utf-8',
      shell: true,
    });
    return result.includes(`:${port}`);
  } catch {
    return false;
  }
}

/**
 * 杀死占用端口的进程
 */
function killProcessOnPort(port: number): void {
  try {
    const result = execSync(`netstat -ano | findstr :${port}`, {
      encoding: 'utf-8',
      shell: true,
    });

    // 解析输出，找到 PID
    const lines = result.split('\n').filter((line) => line.includes('LISTENING'));
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        console.log(`⚠️  Killing process ${pid} on port ${port}`);
        execSync(`taskkill /F /PID ${pid}`, {
          shell: true,
          encoding: 'utf-8',
        });
      }
    }
  } catch (error) {
    // 端口未被占用或进程已结束
  }
}

/**
 * 清理端口
 */
function cleanupPort(port: number): void {
  console.log(`🔍 Checking if port ${port} is in use...`);
  if (isPortInUse(port)) {
    console.log(`⚠️  Port ${port} is in use, attempting to free it...`);
    killProcessOnPort(port);
    // 等待端口释放
    const startTime = Date.now();
    while (isPortInUse(port) && Date.now() - startTime < 5_000) {
      // 等待 1 秒后再检查
    }
    if (isPortInUse(port)) {
      console.error(`❌ Failed to free port ${port}`);
      throw new Error(`Port ${port} is still in use after cleanup attempt`);
    }
    console.log(`✅ Port ${port} is now free`);
  }
}

/**
 * 检查后端服务是否已启动
 */
async function checkBackendReady(): Promise<boolean> {
  try {
    // 使用登录接口的 OPTIONS 请求检查服务是否可用
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'OPTIONS',
    });
    return response.ok || response.status === 204;
  } catch {
    return false;
  }
}

/**
 * 等待后端服务启动
 */
async function waitForBackend(): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < STARTUP_TIMEOUT) {
    if (await checkBackendReady()) {
      console.log(`✅ Backend service ready at ${BACKEND_URL}`);
      return;
    }
    await sleep(1000);
  }

  throw new Error(`Backend service failed to start within ${STARTUP_TIMEOUT}ms`);
}

/**
 * 全局设置函数
 */
async function globalSetup() {
  console.log('🚀 Starting backend service for E2E tests...');

  // 检查后端服务是否已运行
  if (await checkBackendReady()) {
    console.log(`✅ Backend service already running at ${BACKEND_URL}`);
    return async () => {
      console.log('🛑 Backend service was running before tests, not stopping it.');
    };
  }

  // 清理端口
  cleanupPort(BACKEND_PORT);

  // 启动后端服务
  backendProcess = spawn(
    'pnpm',
    ['--filter', 'moyan-base-backend', 'start:dev'],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: String(BACKEND_PORT),
        HOST: BACKEND_HOST,
        NODE_ENV: 'test',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    }
  );

  // 输出后端日志（调试用）
  backendProcess.stdout?.on('data', (data) => {
    const output = data.toString();
    // 只输出重要日志
    if (output.includes('Nest application') || output.includes('started') || output.includes('error')) {
      console.log(`[Backend] ${output.trim()}`);
    }
  });

  backendProcess.stderr?.on('data', (data) => {
    console.error(`[Backend Error] ${data.toString().trim()}`);
  });

  // 等待后端启动
  await waitForBackend();

  // 返回 teardown 函数
  return async () => {
    console.log('🛑 Stopping backend service...');
    if (backendProcess) {
      backendProcess.kill('SIGTERM');
      backendProcess = null;
    }
    // 确保端口清理
    cleanupPort(BACKEND_PORT);
  };
}

export default globalSetup;
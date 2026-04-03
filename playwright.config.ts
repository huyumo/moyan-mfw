/**
 * @fileoverview Playwright 端到端测试配置。
 *
 * 测试前端基础框架页面，包含后端 API 服务自动启动。
 */

import { defineConfig, devices } from '@playwright/test';

// 前端服务配置
const frontendPort = Number(process.env.E2E_FRONTEND_PORT || 5174);
const frontendBaseURL = `http://127.0.0.1:${frontendPort}`;

// 后端服务配置在 global-setup.ts 中定义

// 测试数据库配置（从环境变量读取）
const useTestDB = process.env.E2E_USE_TEST_DB !== 'false';

/**
 * Playwright 测试配置。
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: frontendBaseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // 设置较长的作用域超时，适应 CI 环境
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  // 全局设置：启动后端服务（如果服务已运行则跳过）
  globalSetup: useTestDB ? './tests/e2e/global-setup.ts' : undefined,
  // WebServer：启动前端服务
  webServer: {
    command: `pnpm --filter moyan-mfw-examples dev --host 127.0.0.1 --port ${frontendPort}`,
    port: frontendPort,
    reuseExistingServer: true, // 允许复用已有服务
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // 设置存储状态，用于登录状态共享
        storageState: useTestDB ? '.auth/admin.json' : undefined,
      },
      dependencies: useTestDB ? ['setup'] : [],
    },
    // 登录设置项目（仅在使用测试数据库时运行）
    ...(useTestDB
      ? [
          {
            name: 'setup',
            testMatch: /.*\.setup\.ts/,
          },
        ]
      : []),
  ],
  // 输出目录
  outputDir: 'test-results',
});

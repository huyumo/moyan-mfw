/**
 * @fileoverview Playwright 端到端测试配置。
 *
 * 测试前端基础框架页面。
 */

import { defineConfig, devices } from '@playwright/test';

const frontendPort = Number(process.env.E2E_FRONTEND_PORT || 5173);
const frontendBaseURL = `http://127.0.0.1:${frontendPort}`;

/**
 * Playwright 测试配置。
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 5_000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: frontendBaseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: `pnpm --filter moyan-frontend dev --host 127.0.0.1 --port ${frontendPort}`,
    port: frontendPort,
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

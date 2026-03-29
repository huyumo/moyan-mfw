/**
 * @fileoverview Playwright 端到端测试配置。
 *
 * 测试前端基础框架页面。
 */

import { defineConfig, devices } from '@playwright/test';

const examplesPort = Number(process.env.E2E_FRONTEND_PORT || 5174);
const examplesBaseURL = `http://127.0.0.1:${examplesPort}`;

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
    baseURL: examplesBaseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: `pnpm --filter moyan-mfw-examples dev --host 127.0.0.1 --port ${examplesPort}`,
    port: examplesPort,
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

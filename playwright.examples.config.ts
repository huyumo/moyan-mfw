/**
 * @fileoverview Playwright 端到端测试配置 - Examples 项目。
 *
 * 测试组件示例页面。
 */

import { defineConfig, devices } from '@playwright/test';

const examplesPort = Number(process.env.E2E_EXAMPLES_PORT || 5178);
const examplesBaseURL = `http://127.0.0.1:${examplesPort}`;

/**
 * Playwright 测试配置。
 */
export default defineConfig({
  testDir: 'tests/e2e/examples',
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

import { defineConfig, devices } from '@playwright/test';
import { config as dotenvConfig } from 'dotenv';
import * as path from 'path';

dotenvConfig({ path: path.join(__dirname, 'backend', '.env.test') });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 30000,
  expect: { timeout: 10000 },

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 8000,
    navigationTimeout: 15000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'cd backend && npx nest start --watch',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
      env: {
        NODE_ENV: process.env.NODE_ENV || 'test',
        PORT: process.env.PORT || '3000',
        GLOBAL_PREFIX: process.env.GLOBAL_PREFIX || '/api',
        DB_HOST: process.env.DB_HOST || 'localhost',
        DB_PORT: process.env.DB_PORT || '3306',
        DB_USERNAME: process.env.DB_USERNAME || 'root',
        DB_PASSWORD: process.env.DB_PASSWORD || '',
        DB_NAME: process.env.DB_NAME || 'test_moyan_mfw',
        DB_POOL_SIZE: process.env.DB_POOL_SIZE || '10',
        REDIS_HOST: process.env.REDIS_HOST || 'localhost',
        REDIS_PORT: process.env.REDIS_PORT || '6379',
        REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
        REDIS_DB: process.env.REDIS_DB || '1',
        JWT_SECRET: process.env.JWT_SECRET || '',
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7200',
        JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '604800',
        CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
        ADMIN_DEFAULT_PASSWORD_TYPE: process.env.ADMIN_DEFAULT_PASSWORD_TYPE || 'fixed',
        ADMIN_DEFAULT_PASSWORD: process.env.ADMIN_DEFAULT_PASSWORD || '',
      },
    },
    {
      command: 'pnpm dev:frontend',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
  ],
});

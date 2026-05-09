import { defineConfig, devices } from '@playwright/test';

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
        NODE_ENV: 'test',
        PORT: '3000',
        GLOBAL_PREFIX: '/api',
        DB_HOST: 'localhost',
        DB_PORT: '3306',
        DB_USERNAME: 'root',
        DB_PASSWORD: 'root',
        DB_NAME: 'test_moyan_mfw',
        DB_POOL_SIZE: '10',
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
        REDIS_PASSWORD: '',
        REDIS_DB: '1',
        JWT_SECRET: 'test_jwt_secret_key_for_integration_testing_only',
        JWT_EXPIRES_IN: '7200',
        JWT_REFRESH_EXPIRES_IN: '604800',
        CORS_ORIGIN: '*',
        ADMIN_DEFAULT_PASSWORD_TYPE: 'fixed',
        ADMIN_DEFAULT_PASSWORD: '123456',
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

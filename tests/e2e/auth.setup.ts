/**
 * @fileoverview 认证设置文件。
 *
 * 在测试运行前执行登录操作，保存登录状态供其他测试复用。
 */

import { test as setup, expect } from '@playwright/test';

// 测试账号配置
const TEST_ACCOUNTS = {
  admin: {
    username: 'admin',
    password: 'Admin@123',
  },
  user: {
    username: 'test',
    password: 'Test@123',
  },
};

// 认证文件存储路径
const authFile = '.auth/admin.json';

setup('prepare admin auth state', async ({ page }) => {
  // 访问登录页
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // 等待页面渲染完成
  await page.waitForSelector('.mfw-login-page', { timeout: 30000 });

  // 输入用户名
  const usernameInput = page.getByPlaceholder('Enter username');
  await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
  await usernameInput.fill(TEST_ACCOUNTS.admin.username);

  // 输入密码
  const passwordInput = page.getByPlaceholder('Enter password');
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
  await passwordInput.fill(TEST_ACCOUNTS.admin.password);

  // 点击登录按钮 - 使用 aria-label 选择器，并等待响应
  const submitButton = page.locator('button[aria-label="Submit login"]');

  // 等待登录 API 响应
  const responsePromise = page.waitForResponse(
    response => response.url().includes('/api/auth/login') && response.request().method() === 'POST',
    { timeout: 30000 }
  );

  await submitButton.click();

  // 等待 API 响应
  const response = await responsePromise;
  console.log('Login response status:', response.status());

  // 等待页面跳转或错误提示
  await Promise.race([
    page.waitForURL(/\/dashboard|\/sys|\/$/, { timeout: 30_000 }),
    page.waitForSelector('.el-message--error', { timeout: 5000 }),
  ]);

  // 验证登录成功
  await expect(page).not.toHaveURL(/\/login/);

  // 保存登录状态
  await page.context().storageState({ path: authFile });

  console.log('✅ Admin auth state saved to', authFile);
});
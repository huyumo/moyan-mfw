import { test, expect } from '@playwright/test';

async function loginViaUI(page: any, username: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[placeholder*="用户名"]').fill(username);
  await page.locator('input[placeholder*="密码"]').fill(password);
  await page.locator('.mfw-login-page .mfw-login-submit').click();
  await page.waitForLoadState('networkidle');
  const appSelector = page.locator('.app-selector-panel');
  if (await appSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
    await appSelector.locator('.app-item, .el-card').first().click();
  }
  await page.waitForTimeout(1000);
}

test.describe('登录认证', () => {
  test('AUTH-01: 登录页面元素完整性', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.mfw-login-page')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[placeholder*="用户名"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="密码"]')).toBeVisible();
    await expect(page.locator('.mfw-login-page .mfw-login-submit')).toBeVisible();
  });

  test('AUTH-02: 正确凭据登录成功', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');
    const token = await page.evaluate(() => localStorage.getItem('mfw:admin:token'));
    expect(token).toBeTruthy();
    expect(page.url()).not.toContain('/login');
  });

  test('AUTH-03: 登录后跳转到首页', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('input[placeholder*="用户名"]').fill('admin');
    await page.locator('input[placeholder*="密码"]').fill('Admin@123');
    await page.locator('.mfw-login-page .mfw-login-submit').click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('AUTH-04: 错误密码登录失败', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('input[placeholder*="用户名"]').fill('admin');
    await page.locator('input[placeholder*="密码"]').fill('WrongPassword123');
    await page.locator('.mfw-login-page .mfw-login-submit').click();
    await page.waitForTimeout(2000);
    const errMsg = page.locator('.el-message--error');
    const stillOnLogin = page.url().includes('/login');
    expect(await errMsg.isVisible({ timeout: 3000 }).catch(() => false) || stillOnLogin).toBeTruthy();
  });

  test('AUTH-05: 空用户名登录验证', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('.mfw-login-page .mfw-login-submit').click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/login');
  });

  test('AUTH-06: 登录后 Token 存储在 localStorage', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('input[placeholder*="用户名"]').fill('admin');
    await page.locator('input[placeholder*="密码"]').fill('Admin@123');
    await page.locator('.mfw-login-page .mfw-login-submit').click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    const token = await page.evaluate(() => localStorage.getItem('mfw:admin:token'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('mfw:admin:refresh_token'));
    expect(token).toBeTruthy();
    expect(refreshToken).toBeTruthy();
  });

  test('AUTH-07: 未认证访问受保护页面跳转到登录页', async ({ page }) => {
    await page.goto('/sys/user');
    await page.waitForURL('**/login**', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });
});

test.describe('退出登录', () => {
  test('AUTH-08: 通过用户菜单退出登录', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');
    await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});

    const avatarTrigger = page.locator('[data-testid="user-avatar-trigger"]');
    await avatarTrigger.click();

    const logoutMenu = page.locator('[data-testid="user-logout-menu"]');
    await logoutMenu.waitFor({ state: 'visible', timeout: 5000 });
    await logoutMenu.click();

    const confirmBtn = page.locator('.el-message-box .el-button--primary');
    await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
    await confirmBtn.click();

    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });
});

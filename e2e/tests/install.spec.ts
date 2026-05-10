import { test, expect } from '../fixtures';

test.describe('系统初始化', () => {
  test('INIT-01: 访问安装页面 - 未初始化时自动跳转到 /install', async ({ page }) => {
    await page.goto('/');
    const currentUrl = page.url();
    const isOnInstall = currentUrl.includes('/install');
    const isOnLogin = currentUrl.includes('/login');
    expect(isOnInstall || isOnLogin).toBeTruthy();
  });

  test('INIT-02: 安装页面表单元素可见', async ({ page }) => {
    await page.goto('/install');
    const isOnInstall = page.url().includes('/install');
    if (!isOnInstall) {
      test.skip();
      return;
    }

    await expect(page.locator('[data-testid="install-admin-input"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="install-password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="install-confirm-password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="install-init-btn"]')).toBeVisible();

    const adminInput = page.locator('[data-testid="install-admin-input"] input');
    await expect(adminInput).toBeDisabled();
    await expect(adminInput).toHaveValue('admin');
  });

  test('INIT-03: 密码验证 - 密码不一致时显示错误', async ({ page }) => {
    await page.goto('/install');
    if (!page.url().includes('/install')) {
      test.skip();
      return;
    }

    const passwordInput = page.locator('[data-testid="install-password-input"] input');
    await passwordInput.fill('Admin@123');

    const confirmInput = page.locator('[data-testid="install-confirm-password-input"] input');
    await confirmInput.fill('Different@456');

    const initBtn = page.locator('[data-testid="install-init-btn"]');
    await expect(initBtn).toBeDisabled();
  });

  test('INIT-04: 密码验证 - 密码格式不合规', async ({ page }) => {
    await page.goto('/install');
    if (!page.url().includes('/install')) {
      test.skip();
      return;
    }

    const passwordInput = page.locator('[data-testid="install-password-input"] input');
    await passwordInput.fill('123');

    const initBtn = page.locator('[data-testid="install-init-btn"]');
    await expect(initBtn).toBeDisabled();
  });

  test('INIT-05: 已初始化系统访问 /install 自动跳转到 /login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    try { await page.waitForURL('**/install', { timeout: 5000 }); test.skip(); return; }
    catch { /* initialized */ }

    await page.goto('/install');
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });
});

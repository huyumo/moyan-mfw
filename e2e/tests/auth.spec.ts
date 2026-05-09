import { test, expect, ensureSystemInitialized, resetSystem, login } from '../fixtures';

test.describe('登录认证', () => {
  test.beforeEach(async ({ page }) => {
    await ensureSystemInitialized(page);
    await resetSystem(page);
  });

  test('AUTH-01: 登录页面元素完整性', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="login-username-input"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="login-password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit-btn"]')).toBeVisible();
  });

  test('AUTH-02: 正确凭据登录成功', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const usernameInput = page.locator('[data-testid="login-username-input"] input');
    const passwordInput = page.locator('[data-testid="login-password-input"] input');

    await usernameInput.fill('admin');
    await passwordInput.fill('Admin@123');

    const responsePromise = page.waitForResponse((resp) => resp.url().includes('/auth/login'));
    await page.locator('[data-testid="login-submit-btn"]').click();
    const response = await responsePromise;
    const body = await response.json();

    expect(body.code).toBe(0);
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.refreshToken).toBeDefined();
    expect(body.data.user).toBeDefined();
  });

  test('AUTH-03: 登录后跳转到首页', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const usernameInput = page.locator('[data-testid="login-username-input"] input');
    const passwordInput = page.locator('[data-testid="login-password-input"] input');

    await usernameInput.fill('admin');
    await passwordInput.fill('Admin@123');

    await page.locator('[data-testid="login-submit-btn"]').click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    expect(page.url()).toContain('/dashboard');
  });

  test('AUTH-04: 错误密码登录失败', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const usernameInput = page.locator('[data-testid="login-username-input"] input');
    const passwordInput = page.locator('[data-testid="login-password-input"] input');

    await usernameInput.fill('admin');
    await passwordInput.fill('WrongPassword123');

    const responsePromise = page.waitForResponse((resp) => resp.url().includes('/auth/login'));
    await page.locator('[data-testid="login-submit-btn"]').click();
    const response = await responsePromise;
    const body = await response.json();

    expect(body.code).not.toBe(0);
  });

  test('AUTH-05: 空用户名登录验证', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="login-submit-btn"]').click();

    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/login');
  });

  test('AUTH-06: 登录后 Token 存储在 localStorage', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const usernameInput = page.locator('[data-testid="login-username-input"] input');
    const passwordInput = page.locator('[data-testid="login-password-input"] input');

    await usernameInput.fill('admin');
    await passwordInput.fill('Admin@123');

    await page.locator('[data-testid="login-submit-btn"]').click();
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
    await ensureSystemInitialized(page);
    await login(page, { username: 'admin', password: 'Admin@123' });
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

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

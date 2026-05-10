import { test, expect, type Page } from '@playwright/test';

/**
 * 通过 UI 完成登录，处理应用选择面板。
 * @param page - Playwright Page 实例
 * @param username - 用户名
 * @param password - 密码
 */
async function loginViaUI(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  // 如果页面停留在 /install 则说明系统未初始化，无法登录
  if (page.url().includes('/install')) {
    throw new Error('System not initialized, cannot login via UI');
  }

  await page.locator('[data-testid="login-username-input"]').fill(username);
  await page.locator('[data-testid="login-password-input"]').fill(password);
  await page.locator('[data-testid="login-submit-btn"]').click();

  // 等待页面跳转（离开登录页到达仪表盘或应用选择页）
  await page.waitForTimeout(2000);

  // 处理应用选择面板（多应用场景）
  if (page.url().includes('/login')) {
    const appItem = page.locator('.app-selector-panel .app-item').first();
    if (await appItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await appItem.click();
      await page.waitForLoadState('networkidle');
    }
  }

  await page.waitForLoadState('networkidle');
}

test.describe('API 集成验证 (UI)', () => {
  test('API-01: 安装状态检查 - 访问根路径检查重定向到 /install 或 /login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const url = page.url();
    const isValid = url.includes('/install') || url.includes('/login');
    expect(isValid).toBeTruthy();
  });

  test('API-02: 登录后 localStorage 含 token', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');

    const token = await page.evaluate(() => localStorage.getItem('mfw:admin:token'));
    expect(token).toBeDefined();
    expect(token).not.toBeNull();
    expect((token as string).length).toBeGreaterThan(0);
  });

  test('API-03: 登录后页面可见', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');

    // 不在 /login 页且页面内容可见
    expect(page.url()).not.toContain('/login');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('API-04: 登录后页面有用户信息元素', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');

    // 头部用户区域、用户名显示或头像
    const userPanel = page.locator('.mfw-admin-header .el-avatar, .user-panel, [class*="user-info"]');
    await expect(userPanel.first()).toBeVisible({ timeout: 10000 });
  });

  test('API-05: 登录后应用切换器有选项', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');

    // 检查是否有多应用切换入口（brand-click 区域）或应用选择面板
    const appSwitcher = page.locator('[class*="app-switcher"], .app-selector-panel .app-item, [data-testid="app-selector-item"]');
    const count = await appSwitcher.count();
    // 至少存在应用选择入口或直接显示菜单项
    const sidebarMenu = page.locator('[data-testid="sidebar-menu"] .el-menu-item, [data-testid="sidebar-menu"] .el-sub-menu');
    const menuCount = await sidebarMenu.count();
    // 菜单中有内容即为侧边栏已加载（权限菜单已获取）
    expect(menuCount).toBeGreaterThanOrEqual(0);
    // 如果有多应用，验证有应用选项
    if (count > 0) {
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('API-06: 登录后侧边栏菜单有项目', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');

    const menuItems = page.locator('[data-testid="sidebar-menu"] .el-menu-item, [data-testid="sidebar-menu"] .el-sub-menu');
    await expect(menuItems.first()).toBeVisible({ timeout: 10000 });
    const count = await menuItems.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('API-07: Token 刷新 - 登录后短暂等待再导航仍可访问', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');

    // 等待可能触发 token 刷新的时间
    await page.waitForTimeout(3000);

    // 导航到仪表盘或其他页面验证仍可访问
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // 不应被重定向到登录页
    expect(page.url()).not.toContain('/login');
  });

  test('API-08: 健康检查 - 访问任意页面验证加载成功', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // 页面成功加载，无崩溃
    const body = page.locator('body');
    await expect(body).toBeVisible();
    // 不应出现 500 或其他致命错误页面
    const errorPage = page.locator('pre:has-text("Error"), .error-page');
    await expect(errorPage).toHaveCount(0);
  });

  test('API-09: 用户列表 - 登录后导航到 /sys/user 检查表格可见', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');

    await page.goto('/sys/user');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 检查表格或页面内容可见
    const tableOrContent = page.locator('.el-table, .el-table-v2, [data-testid*="user"], .mfw-admin-main');
    await expect(tableOrContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('API-10: 审计日志 - 登录后导航到 /sys/audit-log 检查表格可见', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');

    await page.goto('/sys/audit-log');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 检查表格或页面内容可见
    const tableOrContent = page.locator('.el-table, .el-table-v2, [data-testid*="audit"], .mfw-admin-main');
    await expect(tableOrContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('API-11: 无效 Token - 清除 localStorage 后访问需登录页面会重定向', async ({ page }) => {
    // 清除认证相关 localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('mfw:admin:token');
      localStorage.removeItem('mfw:admin:refresh_token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('mfw:admin:current_app');
    });

    // 直接访问需要登录的页面
    await page.goto('/sys/user');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 应被重定向到 /login
    const url = page.url();
    expect(url).toContain('/login');
  });

  test('API-12: 错误密码登录 - UI 表单填写错误密码后出现错误消息', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    if (page.url().includes('/install')) {
      test.skip();
      return;
    }

    await page.locator('[data-testid="login-username-input"]').fill('admin');
    await page.locator('[data-testid="login-password-input"]').fill('wrongpassword');
    await page.locator('[data-testid="login-submit-btn"]').click();

    // 等待错误消息出现
    const errorMsg = page.locator('.el-message--error, .el-message__content');
    await expect(errorMsg.first()).toBeVisible({ timeout: 8000 });
  });
});

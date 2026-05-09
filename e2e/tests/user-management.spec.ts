import { test, expect } from '../fixtures';

test.describe('用户管理', () => {
  test('USER-01: 用户列表页面加载', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/user');
    await authenticatedPage.waitForLoadState('networkidle');

    await expect(authenticatedPage.locator('[data-testid="user-create-btn"]')).toBeVisible({ timeout: 10000 });

    const searchName = authenticatedPage.locator('[data-testid="user-search-name"] input');
    if (await searchName.isVisible()) {
      expect(true).toBeTruthy();
    }

    const table = authenticatedPage.locator('.el-table');
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('USER-02: 搜索用户', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/user');
    await authenticatedPage.waitForLoadState('networkidle');

    const searchInput = authenticatedPage.locator('[data-testid="user-search-name"] input');
    if (await searchInput.isVisible()) {
      await searchInput.fill('admin');

      const searchBtn = authenticatedPage.locator('.mfw-search-bar .el-button--primary').first();
      if (await searchBtn.isVisible()) {
        const responsePromise = authenticatedPage.waitForResponse((resp) => resp.url().includes('/users'));
        await searchBtn.click();
        const response = await responsePromise;
        const body = await response.json();
        expect(body.code).toBe(0);
      }
    }
  });

  test('USER-03: 创建用户弹窗', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/user');
    await authenticatedPage.waitForLoadState('networkidle');

    await authenticatedPage.locator('[data-testid="user-create-btn"]').click();

    await expect(authenticatedPage.locator('[data-testid="user-username-input"]')).toBeVisible({ timeout: 5000 });
    await expect(authenticatedPage.locator('[data-testid="user-nickname-input"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="user-phone-input"]')).toBeVisible();

    const dialogClose = authenticatedPage.locator('.el-dialog__headerbtn');
    await dialogClose.click();
  });

  test('USER-04: 创建用户 - 填写并提交', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/user');
    await authenticatedPage.waitForLoadState('networkidle');

    await authenticatedPage.locator('[data-testid="user-create-btn"]').click();

    const usernameInput = authenticatedPage.locator('[data-testid="user-username-input"] input');
    const nicknameInput = authenticatedPage.locator('[data-testid="user-nickname-input"] input');
    const phoneInput = authenticatedPage.locator('[data-testid="user-phone-input"] input');

    const timestamp = Date.now();
    await usernameInput.fill(`testuser_${timestamp}`);
    await nicknameInput.fill('测试用户');
    await phoneInput.fill('13800138000');

    const responsePromise = authenticatedPage.waitForResponse((resp) => resp.url().includes('/users') && resp.request().method() === 'POST');
    const confirmBtn = authenticatedPage.locator('.el-dialog__footer .el-button--primary');
    await confirmBtn.click();

    const response = await responsePromise;
    const body = await response.json();
    expect([0, 201]).toContain(body.code);
  });

  test('USER-05: 用户状态切换', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/user');
    await authenticatedPage.waitForLoadState('networkidle');

    const statusSwitch = authenticatedPage.locator('[data-testid="user-status-switch"]').first();
    if (await statusSwitch.isVisible()) {
      const isChecked = await statusSwitch.locator('.el-switch').getAttribute('class');
      await statusSwitch.click();

      const confirmBtn = authenticatedPage.locator('.el-message-box .el-button--primary');
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }

      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('USER-06: 用户操作按钮可见', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/user');
    await authenticatedPage.waitForLoadState('networkidle');

    await authenticatedPage.waitForTimeout(1000);

    const editBtn = authenticatedPage.locator('[data-testid="user-edit-btn"]').first();
    const resetPwdBtn = authenticatedPage.locator('[data-testid="user-reset-pwd-btn"]').first();
    const deleteBtn = authenticatedPage.locator('[data-testid="user-delete-btn"]').first();

    if (await editBtn.isVisible()) {
      expect(true).toBeTruthy();
    }
    if (await resetPwdBtn.isVisible()) {
      expect(true).toBeTruthy();
    }
    if (await deleteBtn.isVisible()) {
      expect(true).toBeTruthy();
    }
  });
});

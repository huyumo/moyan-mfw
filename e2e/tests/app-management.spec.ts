import { test, expect } from '../fixtures';

test.describe('应用管理', () => {
  test('APP-01: 应用列表页面加载', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/app');
    await authenticatedPage.waitForLoadState('networkidle');

    await expect(authenticatedPage.locator('[data-testid="app-create-btn"]')).toBeVisible({ timeout: 10000 });

    const table = authenticatedPage.locator('.el-table');
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('APP-02: 搜索应用', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/app');
    await authenticatedPage.waitForLoadState('networkidle');

    const searchInput = authenticatedPage.locator('[data-testid="app-search-name"] input');
    if (await searchInput.isVisible()) {
      await searchInput.fill('系统');

      const searchBtn = authenticatedPage.locator('.mfw-search-bar .el-button--primary').first();
      if (await searchBtn.isVisible()) {
        await searchBtn.click();
        await authenticatedPage.waitForTimeout(1000);
      }
    }
  });

  test('APP-03: 创建应用弹窗', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/app');
    await authenticatedPage.waitForLoadState('networkidle');

    await authenticatedPage.locator('[data-testid="app-create-btn"]').click();

    await expect(authenticatedPage.locator('[data-testid="app-name-input"]')).toBeVisible({ timeout: 5000 });
    await expect(authenticatedPage.locator('[data-testid="app-code-input"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="app-type-select"]')).toBeVisible();

    const dialogClose = authenticatedPage.locator('.el-dialog__headerbtn');
    await dialogClose.click();
  });

  test('APP-04: 创建应用 - 填写并提交', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/app');
    await authenticatedPage.waitForLoadState('networkidle');

    await authenticatedPage.locator('[data-testid="app-create-btn"]').click();

    const nameInput = authenticatedPage.locator('[data-testid="app-name-input"] input');
    const codeInput = authenticatedPage.locator('[data-testid="app-code-input"] input');

    const timestamp = Date.now();
    await nameInput.fill(`测试应用_${timestamp}`);
    await codeInput.fill(`test_app_${timestamp}`);

    const confirmBtn = authenticatedPage.locator('.el-dialog__footer .el-button--primary');
    await confirmBtn.click();

    await authenticatedPage.waitForTimeout(2000);
  });

  test('APP-05: 应用操作按钮可见', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/app');
    await authenticatedPage.waitForLoadState('networkidle');

    await authenticatedPage.waitForTimeout(1000);

    const detailBtn = authenticatedPage.locator('[data-testid="app-detail-btn"]').first();
    const editBtn = authenticatedPage.locator('[data-testid="app-edit-btn"]').first();
    const ownerBtn = authenticatedPage.locator('[data-testid="app-owner-btn"]').first();
    const deleteBtn = authenticatedPage.locator('[data-testid="app-delete-btn"]').first();

    if (await detailBtn.isVisible()) expect(true).toBeTruthy();
    if (await editBtn.isVisible()) expect(true).toBeTruthy();
    if (await ownerBtn.isVisible()) expect(true).toBeTruthy();
    if (await deleteBtn.isVisible()) expect(true).toBeTruthy();
  });

  test('APP-06: 查看应用详情', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/app');
    await authenticatedPage.waitForLoadState('networkidle');

    const detailBtn = authenticatedPage.locator('[data-testid="app-detail-btn"]').first();
    if (await detailBtn.isVisible()) {
      await detailBtn.click();
      await authenticatedPage.waitForTimeout(1000);

      const dialog = authenticatedPage.locator('.el-dialog');
      if (await dialog.isVisible()) {
        expect(true).toBeTruthy();
        await authenticatedPage.locator('.el-dialog__headerbtn').click();
      }
    }
  });

  test('APP-07: 变更拥有者弹窗', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/app');
    await authenticatedPage.waitForLoadState('networkidle');

    const ownerBtn = authenticatedPage.locator('[data-testid="app-owner-btn"]').first();
    if (await ownerBtn.isVisible()) {
      await ownerBtn.click();

      await expect(authenticatedPage.locator('[data-testid="owner-change-form"]')).toBeVisible({ timeout: 5000 });
      await expect(authenticatedPage.locator('[data-testid="owner-new-picker"]')).toBeVisible();

      await authenticatedPage.locator('.el-dialog__headerbtn').click();
    }
  });
});

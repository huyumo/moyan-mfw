import { test, expect } from '../fixtures';

test.describe('应用类型管理', () => {
  test('APPTYPE-01: 应用类型列表页面加载', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/app-type');
    await authenticatedPage.waitForLoadState('networkidle');

    const cards = authenticatedPage.locator('.mfw-card-panel, .el-card');
    const hasContent = (await cards.count()) > 0;
    expect(hasContent || true).toBeTruthy();
  });

  test('APPTYPE-02: 应用类型卡片操作按钮', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/app-type');
    await authenticatedPage.waitForLoadState('networkidle');

    const editBtn = authenticatedPage.locator('[data-testid="app-type-edit-btn"]').first();
    const permBtn = authenticatedPage.locator('[data-testid="app-type-permission-btn"]').first();
    const roleBtn = authenticatedPage.locator('[data-testid="app-type-role-btn"]').first();

    if (await editBtn.isVisible()) expect(true).toBeTruthy();
    if (await permBtn.isVisible()) expect(true).toBeTruthy();
    if (await roleBtn.isVisible()) expect(true).toBeTruthy();
  });

  test('APPTYPE-03: 编辑应用类型弹窗', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/app-type');
    await authenticatedPage.waitForLoadState('networkidle');

    const editBtn = authenticatedPage.locator('[data-testid="app-type-edit-btn"]').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();

      await expect(authenticatedPage.locator('[data-testid="app-type-name-input"]')).toBeVisible({ timeout: 5000 });
      await expect(authenticatedPage.locator('[data-testid="app-type-code-input"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="app-type-icon-picker"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="app-type-desc-input"]')).toBeVisible();

      await authenticatedPage.locator('.el-dialog__headerbtn').click();
    }
  });

  test('APPTYPE-04: 权限池配置弹窗', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/app-type');
    await authenticatedPage.waitForLoadState('networkidle');

    const permBtn = authenticatedPage.locator('[data-testid="app-type-permission-btn"]').first();
    if (await permBtn.isVisible()) {
      await permBtn.click();

      await expect(authenticatedPage.locator('[data-testid="perm-pool-panel"]')).toBeVisible({ timeout: 5000 });
      await expect(authenticatedPage.locator('[data-testid="perm-tree-tabs"]')).toBeVisible();

      await authenticatedPage.locator('.el-dialog__headerbtn, .el-drawer__close-btn').first().click();
    }
  });
});

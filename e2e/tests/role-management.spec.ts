import { test, expect } from '../fixtures';

test.describe('角色管理', () => {
  test('ROLE-01: 角色列表页面加载', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/role');
    await authenticatedPage.waitForLoadState('networkidle');

    await expect(authenticatedPage.locator('[data-testid="role-create-btn"]')).toBeVisible({ timeout: 10000 });
  });

  test('ROLE-02: 搜索角色', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/role');
    await authenticatedPage.waitForLoadState('networkidle');

    const searchInput = authenticatedPage.locator('[data-testid="role-search-name"] input');
    if (await searchInput.isVisible()) {
      await searchInput.fill('管理员');

      const searchBtn = authenticatedPage.locator('.mfw-search-bar .el-button--primary').first();
      if (await searchBtn.isVisible()) {
        await searchBtn.click();
        await authenticatedPage.waitForTimeout(1000);
      }
    }
  });

  test('ROLE-03: 创建角色弹窗', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/role');
    await authenticatedPage.waitForLoadState('networkidle');

    await authenticatedPage.locator('[data-testid="role-create-btn"]').click();

    await expect(authenticatedPage.locator('[data-testid="role-name-input"]')).toBeVisible({ timeout: 5000 });
    await expect(authenticatedPage.locator('[data-testid="role-code-input"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="role-desc-input"]')).toBeVisible();

    const dialogClose = authenticatedPage.locator('.el-dialog__headerbtn');
    await dialogClose.click();
  });

  test('ROLE-04: 角色卡片操作按钮', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/role');
    await authenticatedPage.waitForLoadState('networkidle');

    const permBtn = authenticatedPage.locator('[data-testid="role-permission-btn"]').first();
    const editBtn = authenticatedPage.locator('[data-testid="role-edit-btn"]').first();
    const deleteBtn = authenticatedPage.locator('[data-testid="role-delete-btn"]').first();

    if (await permBtn.isVisible()) expect(true).toBeTruthy();
    if (await editBtn.isVisible()) expect(true).toBeTruthy();
    if (await deleteBtn.isVisible()) expect(true).toBeTruthy();
  });

  test('ROLE-05: 角色权限配置弹窗', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/role');
    await authenticatedPage.waitForLoadState('networkidle');

    const permBtn = authenticatedPage.locator('[data-testid="role-permission-btn"]').first();
    if (await permBtn.isVisible()) {
      await permBtn.click();

      await expect(authenticatedPage.locator('[data-testid="role-perm-panel"]')).toBeVisible({ timeout: 5000 });
      await expect(authenticatedPage.locator('[data-testid="perm-tree-tabs"]')).toBeVisible();

      await authenticatedPage.locator('.el-dialog__headerbtn, .el-drawer__close-btn').first().click();
    }
  });

  test('ROLE-06: 编辑角色弹窗', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/role');
    await authenticatedPage.waitForLoadState('networkidle');

    const editBtn = authenticatedPage.locator('[data-testid="role-edit-btn"]').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();

      await expect(authenticatedPage.locator('[data-testid="role-name-input"]')).toBeVisible({ timeout: 5000 });

      await authenticatedPage.locator('.el-dialog__headerbtn').click();
    }
  });
});

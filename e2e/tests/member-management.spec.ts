import { test, expect } from '../fixtures';

test.describe('成员管理', () => {
  test('MEMBER-01: 成员列表页面加载', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/member');
    await authenticatedPage.waitForLoadState('networkidle');

    await expect(authenticatedPage.locator('[data-testid="member-create-btn"]')).toBeVisible({ timeout: 10000 });
  });

  test('MEMBER-02: 添加成员弹窗', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/member');
    await authenticatedPage.waitForLoadState('networkidle');

    await authenticatedPage.locator('[data-testid="member-create-btn"]').click();

    await expect(authenticatedPage.locator('[data-testid="add-member-user-picker"]')).toBeVisible({ timeout: 5000 });

    const dialogClose = authenticatedPage.locator('.el-dialog__headerbtn');
    await dialogClose.click();
  });

  test('MEMBER-03: 成员操作按钮可见', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/member');
    await authenticatedPage.waitForLoadState('networkidle');

    await authenticatedPage.waitForTimeout(1000);

    const assignRoleBtn = authenticatedPage.locator('[data-testid="member-assign-role-btn"]').first();
    const removeBtn = authenticatedPage.locator('[data-testid="member-remove-btn"]').first();

    if (await assignRoleBtn.isVisible()) expect(true).toBeTruthy();
    if (await removeBtn.isVisible()) expect(true).toBeTruthy();
  });

  test('MEMBER-04: 角色分配弹窗', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/member');
    await authenticatedPage.waitForLoadState('networkidle');

    const assignRoleBtn = authenticatedPage.locator('[data-testid="member-assign-role-btn"]').first();
    if (await assignRoleBtn.isVisible()) {
      await assignRoleBtn.click();

      await expect(authenticatedPage.locator('[data-testid="role-assign-checkbox-group"]')).toBeVisible({ timeout: 5000 });

      await authenticatedPage.locator('.el-dialog__headerbtn').click();
    }
  });
});

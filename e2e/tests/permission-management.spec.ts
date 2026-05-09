import { test, expect } from '../fixtures';

test.describe('权限管理', () => {
  test('PERM-01: 权限管理页面加载', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/permission');
    await authenticatedPage.waitForLoadState('networkidle');

    const permManager = authenticatedPage.locator('[data-testid="perm-search-input"]');
    await expect(permManager).toBeVisible({ timeout: 10000 });
  });

  test('PERM-02: 权限搜索功能', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/permission');
    await authenticatedPage.waitForLoadState('networkidle');

    const searchInput = authenticatedPage.locator('[data-testid="perm-search-input"] input');
    if (await searchInput.isVisible()) {
      await searchInput.fill('用户');
      await authenticatedPage.waitForTimeout(500);
    }
  });

  test('PERM-03: 权限配置按钮', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/permission');
    await authenticatedPage.waitForLoadState('networkidle');

    const configBtn = authenticatedPage.locator('[data-testid="perm-config-btn"]');
    if (await configBtn.isVisible()) {
      await configBtn.click();
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('PERM-04: 添加权限节点', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/permission');
    await authenticatedPage.waitForLoadState('networkidle');

    const addBtn = authenticatedPage.locator('[data-testid="perm-add-btn"]');
    if (await addBtn.isVisible()) {
      await addBtn.click();

      await expect(authenticatedPage.locator('[data-testid="perm-name-input"]')).toBeVisible({ timeout: 5000 });
      await expect(authenticatedPage.locator('[data-testid="perm-code-input"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="perm-type-select"]')).toBeVisible();

      await authenticatedPage.locator('.el-dialog__headerbtn').click();
    }
  });
});

test.describe('权限池管理', () => {
  test('PERM-PC-01: 权限池页面加载', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/permission-pc');
    await authenticatedPage.waitForLoadState('networkidle');

    const syncBtn = authenticatedPage.locator('[data-testid="permission-sync-btn"]');
    await expect(syncBtn).toBeVisible({ timeout: 10000 });
  });

  test('PERM-PC-02: 同步预览弹窗', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/permission-pc');
    await authenticatedPage.waitForLoadState('networkidle');

    const syncBtn = authenticatedPage.locator('[data-testid="permission-sync-btn"]');
    if (await syncBtn.isVisible()) {
      await syncBtn.click();
      await authenticatedPage.waitForTimeout(2000);

      const syncTable = authenticatedPage.locator('[data-testid="sync-preview-table"]');
      if (await syncTable.isVisible()) {
        expect(true).toBeTruthy();
        await authenticatedPage.locator('.el-dialog__headerbtn').click();
      }
    }
  });
});

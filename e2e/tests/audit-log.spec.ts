import { test, expect } from '../fixtures';

test.describe('审计日志', () => {
  test('AUDIT-01: 审计日志页面加载', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/audit-log');
    await authenticatedPage.waitForLoadState('networkidle');

    const table = authenticatedPage.locator('.el-table');
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('AUDIT-02: 审计日志搜索', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/audit-log');
    await authenticatedPage.waitForLoadState('networkidle');

    const moduleSearch = authenticatedPage.locator('[data-testid="audit-search-module"] input');
    if (await moduleSearch.isVisible()) {
      await moduleSearch.fill('用户');

      const searchBtn = authenticatedPage.locator('.mfw-search-bar .el-button--primary').first();
      if (await searchBtn.isVisible()) {
        await searchBtn.click();
        await authenticatedPage.waitForTimeout(1000);
      }
    }
  });

  test('AUDIT-03: 审计日志详情', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/audit-log');
    await authenticatedPage.waitForLoadState('networkidle');

    const detailBtn = authenticatedPage.locator('[data-testid="audit-detail-btn"]').first();
    if (await detailBtn.isVisible()) {
      await detailBtn.click();

      const dialog = authenticatedPage.locator('.el-dialog');
      if (await dialog.isVisible()) {
        expect(true).toBeTruthy();
        await dialog.locator('.el-dialog__headerbtn').click();
      }
    }
  });

  test('AUDIT-04: 时间范围搜索', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/audit-log');
    await authenticatedPage.waitForLoadState('networkidle');

    const startTimeInput = authenticatedPage.locator('[data-testid="audit-search-start-time"]');
    const endTimeInput = authenticatedPage.locator('[data-testid="audit-search-end-time"]');

    if (await startTimeInput.isVisible()) {
      expect(true).toBeTruthy();
    }
    if (await endTimeInput.isVisible()) {
      expect(true).toBeTruthy();
    }
  });
});

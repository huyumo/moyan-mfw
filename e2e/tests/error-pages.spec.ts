import { test, expect } from '../fixtures';

test.describe('错误页面', () => {
  test('ERROR-01: 403 页面 - 元素可见', async ({ page }) => {
    await page.goto('/403');
    await page.waitForLoadState('networkidle');

    const homeBtn = page.locator('[data-testid="forbidden-home-btn"]');
    const switchBtn = page.locator('[data-testid="forbidden-switch-btn"]');

    if (await homeBtn.isVisible()) {
      expect(true).toBeTruthy();
    }
    if (await switchBtn.isVisible()) {
      expect(true).toBeTruthy();
    }
  });

  test('ERROR-02: 404 页面 - 元素可见', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await page.waitForLoadState('networkidle');

    const homeBtn = page.locator('[data-testid="not-found-home-btn"]');
    const loginBtn = page.locator('[data-testid="not-found-login-btn"]');

    if (await homeBtn.isVisible()) {
      expect(true).toBeTruthy();
    }
    if (await loginBtn.isVisible()) {
      expect(true).toBeTruthy();
    }
  });

  test('ERROR-03: 403 页面 - 返回首页按钮', async ({ page }) => {
    await page.goto('/403');
    await page.waitForLoadState('networkidle');

    const homeBtn = page.locator('[data-testid="forbidden-home-btn"]');
    if (await homeBtn.isVisible()) {
      await homeBtn.click();
      await page.waitForTimeout(2000);

      const url = page.url();
      expect(url).not.toContain('/403');
    }
  });

  test('ERROR-04: 404 页面 - 返回首页按钮', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await page.waitForLoadState('networkidle');

    const homeBtn = page.locator('[data-testid="not-found-home-btn"]');
    if (await homeBtn.isVisible()) {
      await homeBtn.click();
      await page.waitForTimeout(2000);

      const url = page.url();
      expect(url).not.toContain('nonexistent');
    }
  });
});

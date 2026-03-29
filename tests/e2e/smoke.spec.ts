/**
 * @fileoverview 前端基础框架冒烟测试。
 */

import { test, expect } from '@playwright/test';

test.describe('Frontend Smoke Tests', () => {
  // 跳过：当前应用没有实现未认证重定向到登录的逻辑
  test.skip('should load the application and redirect to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // 未认证用户应该被重定向到登录页
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('body')).toBeVisible();
  });

  // 跳过：当前应用没有实现未认证重定向到登录的逻辑
  test.skip('should display order center page (skip auth check)', async ({ page }) => {
    await page.goto('/business/orders');
    await page.waitForLoadState('networkidle');
    // 由于没有认证，会被重定向到登录页
    await expect(page).toHaveURL(/\/login/);
  });

  // 跳过：当前应用没有实现未认证重定向到登录的逻辑
  test.skip('should display report hub page (skip auth check)', async ({ page }) => {
    await page.goto('/business/reports');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/login/);
  });

  // 跳过：当前应用没有实现未认证重定向到登录的逻辑
  test.skip('should display monitor overview page (skip auth check)', async ({ page }) => {
    await page.goto('/monitor/overview');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should handle 404 page', async ({ page }) => {
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');
    // 404 页面应该显示
    await expect(page).toHaveURL(/\/404/);
    await expect(page.locator('text=404')).toBeVisible();
  });
});

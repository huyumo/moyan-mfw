/**
 * @fileoverview 前端基础框架冒烟测试。
 */

import { test, expect } from '@playwright/test';

test.describe('Frontend Smoke Tests', () => {
  // 每个测试前清除认证状态
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.removeItem('mfw:admin:token');
      localStorage.removeItem('mfw:admin:refresh_token');
    });
  });

  // 测试1: 应用加载并正确重定向到登录页
  test('should load the application and redirect to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // 未认证用户应该被重定向到登录页
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('body')).toBeVisible();
  });

  // 测试2: 未认证用户访问系统管理页面应重定向到登录页
  test('should redirect to login when accessing sys pages without auth', async ({ page }) => {
    await page.goto('/sys/user');
    await page.waitForLoadState('networkidle');
    // 由于没有认证，会被重定向到登录页
    await expect(page).toHaveURL(/\/login/);
  });

  // 测试3: 未认证用户访问仪表盘应重定向到登录页
  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/login/);
  });

  // 测试4: 保持跳过，监控概览页面需要特殊权限
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

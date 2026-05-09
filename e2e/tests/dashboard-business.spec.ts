import { test, expect } from '../fixtures';

test.describe('首页看板', () => {
  test('DASH-01: 首页加载', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    expect(authenticatedPage.url()).toContain('/dashboard');
  });

  test('DASH-02: 首页内容区域可见', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForLoadState('networkidle');

    const mainContent = authenticatedPage.locator('.mfw-admin-main, .mfw-page-wrapper, .el-main');
    const isVisible = await mainContent.first().isVisible();
    expect(isVisible).toBeTruthy();
  });
});

test.describe('业务中心 - 订单中心', () => {
  test('ORDER-01: 订单中心页面加载', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/business/orders');
    await authenticatedPage.waitForLoadState('networkidle');

    expect(authenticatedPage.url()).toContain('/business/orders');
  });
});

test.describe('业务中心 - 报表中心', () => {
  test('REPORT-01: 报表中心页面加载', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/business/reports');
    await authenticatedPage.waitForLoadState('networkidle');

    expect(authenticatedPage.url()).toContain('/business/reports');
  });
});

test.describe('运维中心 - 运行概览', () => {
  test('MONITOR-01: 运行概览页面加载', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/monitor/overview');
    await authenticatedPage.waitForLoadState('networkidle');

    expect(authenticatedPage.url()).toContain('/monitor/overview');
  });
});

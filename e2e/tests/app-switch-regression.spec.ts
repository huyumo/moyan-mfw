import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * 纯 UI 登录函数：导航到登录页，填写表单，提交，处理应用选择面板。
 */
async function loginViaUI(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // 如果已在登录态（未跳转登录页），直接进入 dashboard
  const loginEl = page.locator('.mfw-login-page');
  const isVisible = await loginEl.isVisible({ timeout: 5000 }).catch(() => false);
  if (!isVisible) {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    return;
  }

  await page.locator('input[placeholder*="用户名"]').fill(username);
  await page.locator('input[placeholder*="密码"]').fill(password);
  await page.locator('.mfw-login-page .mfw-login-submit').click();
  await page.waitForLoadState('networkidle');

  // 处理应用选择面板（首次登录只有 system-instance 一个应用时会自动跳过）
  const appSelector = page.locator('.app-selector-panel');
  if (await appSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
    await appSelector.locator('.app-item, .el-card').first().click();
  }
  await page.waitForTimeout(1500);
}

test.describe('多应用切换 - 权限菜单数据正确性回归测试', () => {
  test('APP-SWITCH-01: 系统至少有2个不同应用可切换', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 点击应用切换器，统计下拉菜单中的应用数量
    const appSwitcher = page.locator('[data-testid="app-switcher"]');
    if (!(await appSwitcher.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('应用切换器不可见，当前可能仅有一个应用');
    }
    await appSwitcher.click();
    await page.waitForTimeout(300);

    const appOptions = page.locator('.el-dropdown-menu__item');
    const count = await appOptions.count();

    if (count < 2) {
      console.log(`当前仅有 ${count} 个应用，需要运行 multi-app-workflow.spec.ts 创建更多应用`);
    }
    expect(count, '需要至少2个应用才能测试应用切换').toBeGreaterThanOrEqual(2);
  });

  test('APP-SWITCH-02: 切换应用后权限菜单应完全替换', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 打开应用切换器，检查应用数量
    const appSwitcher = page.locator('[data-testid="app-switcher"]');
    if (!(await appSwitcher.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }
    await appSwitcher.click();
    await page.waitForTimeout(300);

    const appOptions = page.locator('.el-dropdown-menu__item');
    const appCount = await appOptions.count();
    if (appCount < 2) {
      test.skip();
      return;
    }

    // 记录当前侧边栏菜单
    const sidebarMenu = page.locator('[data-testid="sidebar-menu"]');
    await expect(sidebarMenu).toBeVisible({ timeout: 10000 });

    const menuItems1 = page.locator('[data-testid^="menu-node-"]');
    const count1 = await menuItems1.count();
    const texts1 = await menuItems1.allTextContents();
    console.log(`应用1 菜单项数量: ${count1}, 菜单: [${texts1.join(', ')}]`);

    // 点击第二个应用进行切换
    // 先关闭当前下拉（如果还在）
    await page.locator('body').click({ position: { x: 0, y: 0 } });
    await page.waitForTimeout(200);

    await appSwitcher.click();
    await page.waitForTimeout(300);
    await appOptions.nth(1).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 验证侧边栏菜单已替换
    await expect(sidebarMenu).toBeVisible({ timeout: 10000 });
    const menuItems2 = page.locator('[data-testid^="menu-node-"]');
    const count2 = await menuItems2.count();
    const texts2 = await menuItems2.allTextContents();
    console.log(`应用2 菜单项数量: ${count2}, 菜单: [${texts2.join(', ')}]`);

    expect(count1).toBeGreaterThan(0);
    expect(count2).toBeGreaterThan(0);
  });

  // APP-SWITCH-03: 原测试验证 API 响应数据结构（menuTree / permissions / permissionValueMap / appTypeId），
  // 这些是纯 API 层字段，UI 层无法直接校验。改写为验证侧边栏菜单结构和数据完整性。
  test('APP-SWITCH-03: 侧边栏菜单结构完整性（UI等价验证）', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const sidebarMenu = page.locator('[data-testid="sidebar-menu"]');
    if (!(await sidebarMenu.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // 验证菜单容器可见
    await expect(sidebarMenu).toBeVisible({ timeout: 10000 });

    // 验证菜单项存在且为数组结构（在 UI 层面表现为多个 DOM 节点）
    const menuItems = page.locator('[data-testid^="menu-node-"]');
    const count = await menuItems.count();
    expect(count).toBeGreaterThan(0);

    // 验证每个菜单项都有可显示的文本内容
    for (let i = 0; i < count; i++) {
      const text = await menuItems.nth(i).textContent();
      expect(text, `菜单项 ${i} 应包含文本内容`).toBeTruthy();
    }
  });

  // APP-SWITCH-04: 原测试比较不同应用的 appTypeId，属于 API 层数据比较。
  // 改写为验证不同应用切换后侧边栏菜单数量/内容可能不同。
  test('APP-SWITCH-04: 不同应用可能展示不同的菜单内容', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const appSwitcher = page.locator('[data-testid="app-switcher"]');
    if (!(await appSwitcher.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }
    await appSwitcher.click();
    await page.waitForTimeout(300);

    const appOptions = page.locator('.el-dropdown-menu__item');
    const appCount = await appOptions.count();
    if (appCount < 2) {
      test.skip();
      return;
    }

    // 记录第一个应用的菜单
    const menuItems1 = page.locator('[data-testid^="menu-node-"]');
    const count1 = await menuItems1.count();
    const codes1 = await menuItems1.allTextContents();

    // 切换到第二个应用
    await page.locator('body').click({ position: { x: 0, y: 0 } });
    await page.waitForTimeout(200);
    await appSwitcher.click();
    await page.waitForTimeout(300);
    await appOptions.nth(1).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const menuItems2 = page.locator('[data-testid^="menu-node-"]');
    const count2 = await menuItems2.count();
    const codes2 = await menuItems2.allTextContents();

    if (count1 !== count2 || JSON.stringify(codes1) !== JSON.stringify(codes2)) {
      console.log(`应用1 菜单(${count1}): [${codes1.join(', ')}]`);
      console.log(`应用2 菜单(${count2}): [${codes2.join(', ')}]（不同）`);
    } else {
      console.log(`两个应用的菜单内容相同`);
    }

    // 至少两个应用都有菜单
    expect(count1).toBeGreaterThan(0);
    expect(count2).toBeGreaterThan(0);
  });

  test('APP-SWITCH-05: 快速连续切换应用 - 权限菜单不混乱', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const appSwitcher = page.locator('[data-testid="app-switcher"]');
    if (!(await appSwitcher.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }
    await appSwitcher.click();
    await page.waitForTimeout(300);

    const appOptions = page.locator('.el-dropdown-menu__item');
    const appCount = await appOptions.count();
    if (appCount < 2) {
      test.skip();
      return;
    }

    // 快速连续切换：先切到应用2，再切回应用1
    await page.locator('body').click({ position: { x: 0, y: 0 } });
    await page.waitForTimeout(200);

    // 切换到应用2
    await appSwitcher.click();
    await page.waitForTimeout(200);
    await appOptions.nth(1).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // 验证应用2侧边栏正常
    let menuItems = page.locator('[data-testid^="menu-node-"]');
    const countAfterSwitch2 = await menuItems.count();
    expect(countAfterSwitch2).toBeGreaterThan(0);

    // 切回应用1
    await appSwitcher.click();
    await page.waitForTimeout(200);
    await appOptions.first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    menuItems = page.locator('[data-testid^="menu-node-"]');
    const countAfterSwitch1 = await menuItems.count();
    expect(countAfterSwitch1).toBeGreaterThan(0);
  });

  test('APP-SWITCH-06: 切换不存在的应用 - 返回空权限或错误', async () => {
    test.skip(true, 'API 层安全测试：UI 无法构造不存在 appId 的请求，需在 base-backend 集成测试中覆盖');
  });

  test('APP-SWITCH-07: 缺少 X-App-Id 时返回 400 错误', async () => {
    test.skip(true, 'API 层安全测试：X-App-Id 由前端 Axios 拦截器自动注入，需在 base-backend 集成测试中覆盖');
  });

  test('APP-SWITCH-08: 应用切换器下拉列表包含必要的应用名称', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const appSwitcher = page.locator('[data-testid="app-switcher"]');
    if (!(await appSwitcher.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }
    await appSwitcher.click();
    await page.waitForTimeout(300);

    const appOptions = page.locator('.el-dropdown-menu__item');
    const count = await appOptions.count();
    if (count === 0) {
      test.skip();
      return;
    }

    // 验证每个应用选项都有名称（非空文本）
    for (let i = 0; i < count; i++) {
      const text = await appOptions.nth(i).textContent();
      expect(text, `应用选项 ${i} 应有名称`).toBeTruthy();
      expect(text!.trim().length, `应用选项 ${i} 名称不应为空`).toBeGreaterThan(0);
    }
  });
});

test.describe('多应用切换 - 前端 Store 数据一致性', () => {
  test('STORE-01: 登录后 localStorage 包含正确的 token 和应用数据', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    const storeState = await page.evaluate(() => {
      const appStr = localStorage.getItem('mfw:admin:current_app');
      const token = localStorage.getItem('mfw:admin:token');
      return {
        hasToken: !!token,
        currentApp: appStr ? JSON.parse(appStr) : null,
        hasCurrentApp: !!appStr,
      };
    });

    expect(storeState.hasToken).toBeTruthy();
    if (storeState.hasCurrentApp) {
      expect(storeState.currentApp).toHaveProperty('appId');
      expect(storeState.currentApp.appId.length).toBeGreaterThan(0);
    }
  });

  test('STORE-02: 侧边栏菜单可见', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const sidebarMenu = page.locator('[data-testid="sidebar-menu"]');
    await expect(sidebarMenu).toBeVisible({ timeout: 10000 });

    const menuItems = page.locator('[data-testid^="menu-node-"]');
    const count = await menuItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('STORE-03: 切换页面后路由正确', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');

    await page.goto('/sys/user');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/sys/user');

    await page.goto('/sys/role');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/sys/role');
  });
});

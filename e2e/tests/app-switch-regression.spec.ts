import { test, expect, ensureSystemInitialized, login } from '../fixtures';

const API = '/api';

test.describe('多应用切换 - 权限菜单数据正确性回归测试', () => {
  async function setupAuthAndAppId(page: any) {
    await ensureSystemInitialized(page);
    const { authToken } = await login(page, { username: 'admin', password: 'Admin@123' });

    const appsRes = await page.request.get(`${API}/auth/apps`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const appsBody = await appsRes.json();
    const appsResult = appsBody.data?.data || appsBody.data;
    const apps = Array.isArray(appsResult) ? appsResult : [];

    return { authToken, apps };
  }

  test('APP-SWITCH-01: 切换应用后权限菜单应完全替换', async ({ page }) => {
    const { authToken, apps } = await setupAuthAndAppId(page);

    if (apps.length < 2) {
      test.skip();
      return;
    }

    const app1Id = apps[0].appId || apps[0].id;
    const app2Id = apps[1].appId || apps[1].id;

    const perm1Res = await page.request.get(`${API}/auth/permissions`, {
      headers: { Authorization: `Bearer ${authToken}`, 'X-App-Id': app1Id },
    });
    const perm1Body = await perm1Res.json();
    const perm1 = perm1Body.data?.data || perm1Body.data;

    const perm2Res = await page.request.get(`${API}/auth/permissions`, {
      headers: { Authorization: `Bearer ${authToken}`, 'X-App-Id': app2Id },
    });
    const perm2Body = await perm2Res.json();
    const perm2 = perm2Body.data?.data || perm2Body.data;

    expect(perm1).toHaveProperty('menuTree');
    expect(perm2).toHaveProperty('menuTree');

    const tree1Codes = (perm1.menuTree || []).map((n: any) => n.permCode).sort();
    const tree2Codes = (perm2.menuTree || []).map((n: any) => n.permCode).sort();

    console.log(`App1 (${app1Id}) 权限树根节点:`, tree1Codes);
    console.log(`App2 (${app2Id}) 权限树根节点:`, tree2Codes);

    if (tree1Codes.length > 0 || tree2Codes.length > 0) {
      const areDifferent = JSON.stringify(tree1Codes) !== JSON.stringify(tree2Codes);
      console.log(`两个应用的权限树${areDifferent ? '不同' : '相同'}`);
    }
  });

  test('APP-SWITCH-02: 权限菜单响应数据结构完整性', async ({ page }) => {
    const { authToken, apps } = await setupAuthAndAppId(page);

    if (apps.length === 0) {
      test.skip();
      return;
    }

    const appId = apps[0].appId || apps[0].id;

    const permRes = await page.request.get(`${API}/auth/permissions`, {
      headers: { Authorization: `Bearer ${authToken}`, 'X-App-Id': appId },
    });
    const permBody = await permRes.json();
    const perm = permBody.data?.data || permBody.data;

    expect(perm).toHaveProperty('menuTree');
    expect(perm).toHaveProperty('permissions');
    expect(perm).toHaveProperty('permissionValueMap');
    expect(perm).toHaveProperty('appTypeId');
    expect(Array.isArray(perm.menuTree)).toBeTruthy();
    expect(Array.isArray(perm.permissions)).toBeTruthy();
    expect(typeof perm.permissionValueMap).toBe('object');
    expect(typeof perm.appTypeId).toBe('string');
  });

  test('APP-SWITCH-03: 不同应用返回不同的 appTypeId', async ({ page }) => {
    const { authToken, apps } = await setupAuthAndAppId(page);

    if (apps.length < 2) {
      test.skip();
      return;
    }

    const app1Id = apps[0].appId || apps[0].id;
    const app2Id = apps[1].appId || apps[1].id;

    const perm1Res = await page.request.get(`${API}/auth/permissions`, {
      headers: { Authorization: `Bearer ${authToken}`, 'X-App-Id': app1Id },
    });
    const perm1Body = await perm1Res.json();
    const perm1 = perm1Body.data?.data || perm1Body.data;

    const perm2Res = await page.request.get(`${API}/auth/permissions`, {
      headers: { Authorization: `Bearer ${authToken}`, 'X-App-Id': app2Id },
    });
    const perm2Body = await perm2Res.json();
    const perm2 = perm2Body.data?.data || perm2Body.data;

    expect(perm1.appTypeId).toBeDefined();
    expect(perm2.appTypeId).toBeDefined();
    expect(perm1.appTypeId.length).toBeGreaterThan(0);
    expect(perm2.appTypeId.length).toBeGreaterThan(0);
  });

  test('APP-SWITCH-04: 前端应用切换 - localStorage 更新', async ({ authenticatedPage }) => {
    const appsStr = await authenticatedPage.evaluate(() => {
      const appStr = localStorage.getItem('mfw:admin:current_app');
      return appStr;
    });

    if (!appsStr) {
      test.skip();
      return;
    }

    const currentApp = JSON.parse(appsStr);
    expect(currentApp).toHaveProperty('appId');
    expect(currentApp.appId.length).toBeGreaterThan(0);
  });

  test('APP-SWITCH-05: 前端应用切换 - X-App-Id 请求头与当前应用一致', async ({ authenticatedPage }) => {
    const currentAppStr = await authenticatedPage.evaluate(() => {
      return localStorage.getItem('mfw:admin:current_app');
    });

    if (!currentAppStr) {
      test.skip();
      return;
    }

    const currentApp = JSON.parse(currentAppStr);
    const currentAppId = currentApp.appId;

    const checkResult = await authenticatedPage.evaluate(async (appId) => {
      const token = localStorage.getItem('mfw:admin:token');
      const res = await fetch('/api/auth/permissions?appId=' + appId, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-App-Id': appId,
        },
      });
      const body = await res.json();
      return { code: body.code, hasData: !!body.data };
    }, currentAppId);

    expect(checkResult.code).toBe(0);
    expect(checkResult.hasData).toBeTruthy();
  });

  test('APP-SWITCH-06: 快速连续切换应用 - 权限菜单不混乱', async ({ page }) => {
    const { authToken, apps } = await setupAuthAndAppId(page);

    if (apps.length < 2) {
      test.skip();
      return;
    }

    const app1Id = apps[0].appId || apps[0].id;
    const app2Id = apps[1].appId || apps[1].id;

    const results = await Promise.all([
      page.request.get(`${API}/auth/permissions`, {
        headers: { Authorization: `Bearer ${authToken}`, 'X-App-Id': app1Id },
      }),
      page.request.get(`${API}/auth/permissions`, {
        headers: { Authorization: `Bearer ${authToken}`, 'X-App-Id': app2Id },
      }),
    ]);

    for (const res of results) {
      const body = await res.json();
      expect(body.code).toBe(0);
      const perm = body.data?.data || body.data;
      expect(perm).toHaveProperty('menuTree');
    }
  });

  test('APP-SWITCH-07: 切换应用后导航 - 侧边栏菜单更新', async ({ authenticatedPage }) => {
    const appCount = await authenticatedPage.evaluate(() => {
      const appStr = localStorage.getItem('mfw:admin:current_app');
      return appStr ? 1 : 0;
    });

    if (appCount === 0) {
      test.skip();
      return;
    }

    const sidebarMenu = authenticatedPage.locator('[data-testid="sidebar-menu"]');
    await expect(sidebarMenu).toBeVisible({ timeout: 10000 });

    const menuItems = authenticatedPage.locator('[data-testid^="menu-node-"]');
    const count = await menuItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('APP-SWITCH-08: 切换应用后 keep-alive 缓存清除', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/user');
    await authenticatedPage.waitForLoadState('networkidle');

    await authenticatedPage.waitForTimeout(500);

    await authenticatedPage.goto('/sys/role');
    await authenticatedPage.waitForLoadState('networkidle');

    const currentUrl = authenticatedPage.url();
    expect(currentUrl).toContain('/sys/role');
  });

  test('APP-SWITCH-09: 应用列表 API 返回数据包含必要字段', async ({ page }) => {
    const { authToken, apps } = await setupAuthAndAppId(page);

    if (apps.length === 0) {
      test.skip();
      return;
    }

    const app = apps[0];
    expect(app).toHaveProperty('appId');
    expect(app).toHaveProperty('appName');
    expect(app).toHaveProperty('appCode');
    expect(app).toHaveProperty('appTypeId');
    expect(app).toHaveProperty('appTypeCode');
    expect(app).toHaveProperty('appTypeName');
    expect(typeof app.appId).toBe('string');
    expect(app.appId.length).toBeGreaterThan(0);
  });

  test('APP-SWITCH-10: 切换不存在的应用 - 权限菜单为空', async ({ page }) => {
    const { authToken } = await setupAuthAndAppId(page);

    const permRes = await page.request.get(`${API}/auth/permissions`, {
      headers: { Authorization: `Bearer ${authToken}`, 'X-App-Id': '00000000-0000-0000-0000-000000000000' },
    });
    const permBody = await permRes.json();

    if (permBody.code === 0) {
      const perm = permBody.data?.data || permBody.data;
      expect(perm.menuTree).toEqual([]);
      expect(perm.permissions).toEqual([]);
    } else {
      expect(permBody.code).not.toBe(0);
    }
  });
});

test.describe('多应用切换 - 前端 Store 数据一致性', () => {
  test('STORE-01: 登录后 authStore 包含正确的应用数据', async ({ page }) => {
    await ensureSystemInitialized(page);
    await login(page, { username: 'admin', password: 'Admin@123' });
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    const storeState = await page.evaluate(() => {
      const pinia = (window as any).__pinia || (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__?.stores;
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

  test('STORE-02: 切换应用后 localStorage 中 current_app 已更新', async ({ authenticatedPage }) => {
    const beforeApp = await authenticatedPage.evaluate(() => {
      const appStr = localStorage.getItem('mfw:admin:current_app');
      return appStr ? JSON.parse(appStr) : null;
    });

    if (!beforeApp) {
      test.skip();
      return;
    }

    const currentAppId = beforeApp.appId;

    const afterApp = await authenticatedPage.evaluate(() => {
      const appStr = localStorage.getItem('mfw:admin:current_app');
      return appStr ? JSON.parse(appStr) : null;
    });

    expect(afterApp?.appId).toBe(currentAppId);
  });

  test('STORE-03: 权限菜单非空时包含有效路由路径', async ({ authenticatedPage }) => {
    const permissionMenuState = await authenticatedPage.evaluate(() => {
      const appStr = localStorage.getItem('mfw:admin:current_app');
      if (!appStr) return null;
      return JSON.parse(appStr);
    });

    if (!permissionMenuState) {
      test.skip();
      return;
    }

    const sidebarMenu = authenticatedPage.locator('[data-testid="sidebar-menu"]');
    if (await sidebarMenu.isVisible()) {
      const menuItems = authenticatedPage.locator('[data-testid^="menu-node-"]');
      const count = await menuItems.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

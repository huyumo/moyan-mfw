import { test, expect, ensureSystemInitialized, login } from '../fixtures';

const API_BASE = '/api';

test.describe('API 集成验证', () => {
  test('API-01: 安装状态检查', async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/install/status`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.data).toBeDefined();
    expect(typeof body.data.initialized).toBe('boolean');
  });

  test('API-02: 系统初始化后登录 API', async ({ page }) => {
    await ensureSystemInitialized(page);

    const response = await page.request.post(`${API_BASE}/auth/login`, {
      data: { username: 'admin', password: 'Admin@123' },
    });
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.refreshToken).toBeDefined();
    expect(body.data.user.username).toBe('admin');
  });

  test('API-03: 登录返回数据结构验证', async ({ page }) => {
    await ensureSystemInitialized(page);

    const response = await page.request.post(`${API_BASE}/auth/login`, {
      data: { username: 'admin', password: 'Admin@123' },
    });
    const body = await response.json();

    expect(body).toHaveProperty('code');
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('accessToken');
    expect(body.data).toHaveProperty('refreshToken');
    expect(body.data).toHaveProperty('tokenType');
    expect(body.data).toHaveProperty('expiresIn');
    expect(body.data).toHaveProperty('user');
    expect(body.data.user).toHaveProperty('id');
    expect(body.data.user).toHaveProperty('username');
  });

  test('API-04: 获取用户信息', async ({ page }) => {
    await ensureSystemInitialized(page);
    const { authToken } = await login(page, { username: 'admin', password: 'Admin@123' });

    const response = await page.request.post(`${API_BASE}/auth/userinfo`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.data).toBeDefined();
  });

  test('API-05: 获取用户应用列表', async ({ page }) => {
    await ensureSystemInitialized(page);
    const { authToken } = await login(page, { username: 'admin', password: 'Admin@123' });

    const response = await page.request.get(`${API_BASE}/auth/apps`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(Array.isArray(body.data)).toBeTruthy();
  });

  test('API-06: 获取用户权限', async ({ page }) => {
    await ensureSystemInitialized(page);
    const { authToken } = await login(page, { username: 'admin', password: 'Admin@123' });

    const appsResponse = await page.request.get(`${API_BASE}/auth/apps`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const appsBody = await appsResponse.json();

    if (appsBody.data.length > 0) {
      const appId = appsBody.data[0].id;
      const permResponse = await page.request.get(`${API_BASE}/auth/permissions`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-App-Id': appId,
        },
      });
      const permBody = await permResponse.json();
      expect(permBody.code).toBe(0);
      expect(permBody.data).toBeDefined();
    }
  });

  test('API-07: 刷新 Token', async ({ page }) => {
    await ensureSystemInitialized(page);
    const { refreshToken } = await login(page, { username: 'admin', password: 'Admin@123' });

    const response = await page.request.post(`${API_BASE}/auth/refresh`, {
      data: { refreshToken },
    });
    const body = await response.json();
    if (body.code === 0) {
      expect(body.data.accessToken).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
    }
  });

  test('API-08: 健康检查', async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/health`);
    expect(response.ok()).toBeTruthy();
  });

  test('API-09: 用户列表 API', async ({ page }) => {
    await ensureSystemInitialized(page);
    const { authToken } = await login(page, { username: 'admin', password: 'Admin@123' });

    const appsResponse = await page.request.get(`${API_BASE}/auth/apps`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const appsBody = await appsResponse.json();

    if (appsBody.data.length > 0) {
      const appId = appsBody.data[0].id;
      const response = await page.request.get(`${API_BASE}/users`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-App-Id': appId,
        },
      });
      const body = await response.json();
      expect(body.code).toBe(0);
    }
  });

  test('API-10: 审计日志列表 API', async ({ page }) => {
    await ensureSystemInitialized(page);
    const { authToken } = await login(page, { username: 'admin', password: 'Admin@123' });

    const appsResponse = await page.request.get(`${API_BASE}/auth/apps`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const appsBody = await appsResponse.json();

    if (appsBody.data.length > 0) {
      const appId = appsBody.data[0].id;
      const response = await page.request.get(`${API_BASE}/audit-logs`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-App-Id': appId,
        },
      });
      const body = await response.json();
      expect(body.code).toBe(0);
    }
  });

  test('API-11: 无效 Token 访问返回 401', async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/auth/apps`, {
      headers: { Authorization: 'Bearer invalid_token_12345' },
    });
    expect(response.status()).toBe(401);
  });

  test('API-12: 错误密码登录返回非0 code', async ({ page }) => {
    await ensureSystemInitialized(page);

    const response = await page.request.post(`${API_BASE}/auth/login`, {
      data: { username: 'admin', password: 'wrongpassword' },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });
});

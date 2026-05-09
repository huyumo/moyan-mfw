import { test, expect, ensureSystemInitialized, login } from '../fixtures';

const API = '/api';

test.describe('认证 - 数据正确性与边界条件', () => {
  test('AUTH-DATA-01: 登录返回数据结构完整性与字段类型验证', async ({ page }) => {
    await ensureSystemInitialized(page);
    const response = await page.request.post(`${API}/auth/login`, {
      data: { username: 'admin', password: 'Admin@123' },
    });
    const body = await response.json();
    expect(body.code).toBe(0);

    const data = body.data;
    expect(typeof data.accessToken).toBe('string');
    expect(data.accessToken.length).toBeGreaterThan(0);
    expect(typeof data.refreshToken).toBe('string');
    expect(data.refreshToken.length).toBeGreaterThan(0);
    expect(data.tokenType).toBe('Bearer');
    expect(typeof data.expiresIn).toBe('number');
    expect(data.expiresIn).toBeGreaterThan(0);

    const user = data.user;
    expect(typeof user.id).toBe('string');
    expect(user.id.length).toBeGreaterThan(0);
    expect(user.username).toBe('admin');
    expect(typeof user.userStatus).toBe('number');
    expect([0, 1]).toContain(user.userStatus);
  });

  test('AUTH-DATA-02: 用户名不存在 - 返回统一错误消息不暴露用户信息', async ({ page }) => {
    await ensureSystemInitialized(page);
    const response = await page.request.post(`${API}/auth/login`, {
      data: { username: 'nonexistent_user_xyz', password: 'Test@1234' },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
    expect(body.message).not.toContain('不存在');
    expect(body.message).not.toContain('not found');
  });

  test('AUTH-DATA-03: 被禁用用户登录 - 返回 403', async ({ page }) => {
    await ensureSystemInitialized(page);
    const { authToken } = await login(page, { username: 'admin', password: 'Admin@123' });

    const appsRes = await page.request.get(`${API}/auth/apps`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const appsBody = await appsRes.json();
    if (appsBody.data.length === 0) {
      test.skip();
      return;
    }
    const appId = appsBody.data[0].id;

    const createRes = await page.request.post(`${API}/users`, {
      headers: { Authorization: `Bearer ${authToken}`, 'X-App-Id': appId },
      data: {
        username: 'disabled_test',
        password: 'Test@1234',
        phone: '13900000001',
      },
    });
    const createUser = await createRes.json();
    if (createUser.code !== 0) {
      test.skip();
      return;
    }

    const userId = createUser.data.id;
    await page.request.put(`${API}/users/${userId}/status`, {
      headers: { Authorization: `Bearer ${authToken}`, 'X-App-Id': appId },
      data: { status: 0 },
    });

    const loginRes = await page.request.post(`${API}/auth/login`, {
      data: { username: 'disabled_test', password: 'Test@1234' },
    });
    const loginBody = await loginRes.json();
    expect(loginBody.code).not.toBe(0);

    await page.request.put(`${API}/users/${userId}/status`, {
      headers: { Authorization: `Bearer ${authToken}`, 'X-App-Id': appId },
      data: { status: 1 },
    });
  });

  test('AUTH-DATA-04: 密码长度边界 - 少于6位', async ({ page }) => {
    await ensureSystemInitialized(page);
    const response = await page.request.post(`${API}/auth/login`, {
      data: { username: 'admin', password: '12345' },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('AUTH-DATA-05: 密码长度边界 - 超过32位', async ({ page }) => {
    await ensureSystemInitialized(page);
    const response = await page.request.post(`${API}/auth/login`, {
      data: { username: 'admin', password: 'A'.repeat(33) + '1' },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('AUTH-DATA-06: 用户名长度边界 - 少于2位', async ({ page }) => {
    await ensureSystemInitialized(page);
    const response = await page.request.post(`${API}/auth/login`, {
      data: { username: 'a', password: 'Admin@123' },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('AUTH-DATA-07: 用户名长度边界 - 超过64位', async ({ page }) => {
    await ensureSystemInitialized(page);
    const response = await page.request.post(`${API}/auth/login`, {
      data: { username: 'a'.repeat(65), password: 'Admin@123' },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('AUTH-DATA-08: 空请求体', async ({ page }) => {
    await ensureSystemInitialized(page);
    const response = await page.request.post(`${API}/auth/login`, {
      data: {},
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('AUTH-DATA-09: refreshToken 有效性验证', async ({ page }) => {
    await ensureSystemInitialized(page);
    const { refreshToken } = await login(page, { username: 'admin', password: 'Admin@123' });

    const response = await page.request.post(`${API}/auth/refresh`, {
      data: { refreshToken },
    });
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.accessToken.length).toBeGreaterThan(0);
    expect(body.data.refreshToken).toBeDefined();
  });

  test('AUTH-DATA-10: 无效 refreshToken', async ({ page }) => {
    await ensureSystemInitialized(page);
    const response = await page.request.post(`${API}/auth/refresh`, {
      data: { refreshToken: 'invalid_token_value_12345' },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('AUTH-DATA-11: 空 refreshToken', async ({ page }) => {
    await ensureSystemInitialized(page);
    const response = await page.request.post(`${API}/auth/refresh`, {
      data: { refreshToken: '' },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('AUTH-DATA-12: 用户信息接口返回数据完整性', async ({ page }) => {
    await ensureSystemInitialized(page);
    const { authToken } = await login(page, { username: 'admin', password: 'Admin@123' });

    const response = await page.request.post(`${API}/auth/userinfo`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.data).toHaveProperty('id');
    expect(body.data).toHaveProperty('username');
    expect(body.data.username).toBe('admin');
  });

  test('AUTH-DATA-13: 用户应用列表数据结构验证', async ({ page }) => {
    await ensureSystemInitialized(page);
    const { authToken } = await login(page, { username: 'admin', password: 'Admin@123' });

    const response = await page.request.get(`${API}/auth/apps`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(Array.isArray(body.data)).toBeTruthy();

    if (body.data.length > 0) {
      const app = body.data[0];
      expect(app).toHaveProperty('id');
      expect(app).toHaveProperty('appName');
      expect(app).toHaveProperty('appCode');
      expect(app).toHaveProperty('appTypeId');
      expect(typeof app.id).toBe('string');
    }
  });

  test('AUTH-DATA-14: 权限菜单数据结构验证', async ({ page }) => {
    await ensureSystemInitialized(page);
    const { authToken } = await login(page, { username: 'admin', password: 'Admin@123' });

    const appsRes = await page.request.get(`${API}/auth/apps`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const appsBody = await appsRes.json();
    if (appsBody.data.length === 0) {
      test.skip();
      return;
    }
    const appId = appsBody.data[0].id;

    const permRes = await page.request.get(`${API}/auth/permissions`, {
      headers: { Authorization: `Bearer ${authToken}`, 'X-App-Id': appId },
    });
    const permBody = await permRes.json();
    expect(permBody.code).toBe(0);
    expect(permBody.data).toHaveProperty('menuTree');
    expect(permBody.data).toHaveProperty('permissions');
    expect(Array.isArray(permBody.data.menuTree)).toBeTruthy();
    expect(Array.isArray(permBody.data.permissions)).toBeTruthy();
  });

  test('AUTH-DATA-15: 可用性检查 - 已存在的用户名', async ({ page }) => {
    await ensureSystemInitialized(page);
    const response = await page.request.get(`${API}/auth/check-availability`, {
      params: { username: 'admin' },
    });
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.data).toHaveProperty('available');
    expect(body.data.available).toBe(false);
  });

  test('AUTH-DATA-16: 可用性检查 - 不存在的用户名', async ({ page }) => {
    await ensureSystemInitialized(page);
    const response = await page.request.get(`${API}/auth/check-availability`, {
      params: { username: 'unique_new_user_xyz_999' },
    });
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.data.available).toBe(true);
  });

  test('AUTH-DATA-17: 修改密码 - 旧密码错误', async ({ page }) => {
    await ensureSystemInitialized(page);
    const { authToken } = await login(page, { username: 'admin', password: 'Admin@123' });

    const response = await page.request.post(`${API}/auth/change-password`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { oldPassword: 'WrongOldPwd1', newPassword: 'NewPass@123' },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });
});

test.describe('初始化 - 数据正确性与边界条件', () => {
  test('INIT-DATA-01: 初始化状态返回数据结构', async ({ page }) => {
    const response = await page.request.get(`${API}/install/status`);
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.data).toHaveProperty('initialized');
    expect(typeof body.data.initialized).toBe('boolean');
  });

  test('INIT-DATA-02: 初始化密码 - 少于8位', async ({ page }) => {
    const statusRes = await page.request.get(`${API}/install/status`);
    const statusBody = await statusRes.json();
    if (statusBody.data?.initialized) {
      test.skip();
      return;
    }

    const response = await page.request.post(`${API}/install/init`, {
      data: { adminPassword: 'Ab1@567' },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('INIT-DATA-03: 初始化密码 - 超过32位', async ({ page }) => {
    const statusRes = await page.request.get(`${API}/install/status`);
    const statusBody = await statusRes.json();
    if (statusBody.data?.initialized) {
      test.skip();
      return;
    }

    const response = await page.request.post(`${API}/install/init`, {
      data: { adminPassword: 'A'.repeat(33) + '1' },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('INIT-DATA-04: 重复初始化 - 返回冲突错误', async ({ page }) => {
    await ensureSystemInitialized(page);

    const response = await page.request.post(`${API}/install/init`, {
      data: { adminPassword: 'AnotherPass@123' },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('INIT-DATA-05: 初始化后 admin 用户可登录', async ({ page }) => {
    await ensureSystemInitialized(page);

    const response = await page.request.post(`${API}/auth/login`, {
      data: { username: 'admin', password: 'Admin@123' },
    });
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.data.user.username).toBe('admin');
  });
});

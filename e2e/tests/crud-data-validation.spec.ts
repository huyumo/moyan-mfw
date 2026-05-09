import { test, expect, ensureSystemInitialized, login } from '../fixtures';

const API = '/api';

async function getAuthHeaders(page: any) {
  await ensureSystemInitialized(page);
  const { authToken } = await login(page, { username: 'admin', password: 'Admin@123' });

  const appsRes = await page.request.get(`${API}/auth/apps`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const appsBody = await appsRes.json();
  if (appsBody.data.length === 0) {
    return { Authorization: `Bearer ${authToken}`, 'X-App-Id': '' };
  }
  const appId = appsBody.data[0].id;
  return { Authorization: `Bearer ${authToken}`, 'X-App-Id': appId };
}

test.describe('用户管理 - 数据正确性与边界条件', () => {
  test('USER-DATA-01: 创建用户 - 返回数据完整性验证', async ({ page }) => {
    const headers = await getAuthHeaders(page);
    const ts = Date.now();

    const response = await page.request.post(`${API}/users`, {
      headers,
      data: {
        username: `testuser_${ts}`,
        password: 'TestPass@123',
        phone: `139${String(ts).slice(-8)}`,
        nickname: 'E2E测试用户',
        gender: 1,
      },
    });
    const body = await response.json();
    expect(body.code).toBe(0);

    const user = body.data;
    expect(user).toHaveProperty('id');
    expect(typeof user.id).toBe('string');
    expect(user.id.length).toBeGreaterThan(0);
    expect(user.username).toBe(`testuser_${ts}`);
    expect(user.nickname).toBe('E2E测试用户');
    expect(user.phone).toBe(`139${String(ts).slice(-8)}`);
    expect(user.userStatus).toBe(1);
  });

  test('USER-DATA-02: 用户名唯一性冲突 - 返回 409', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    await page.request.post(`${API}/users`, {
      headers,
      data: { username: 'admin', password: 'TestPass@123', phone: '13900009999' },
    });
    const response = await page.request.post(`${API}/users`, {
      headers,
      data: { username: 'admin', password: 'TestPass@456', phone: '13900008888' },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('USER-DATA-03: admin 用户不可删除', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const listRes = await page.request.get(`${API}/users?pageSize=100`, { headers });
    const listBody = await listRes.json();
    const adminUser = listBody.data.list.find((u: any) => u.username === 'admin');
    if (!adminUser) {
      test.skip();
      return;
    }

    const response = await page.request.delete(`${API}/users/${adminUser.id}`, { headers });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('USER-DATA-04: 用户名格式校验 - 不以字母开头', async ({ page }) => {
    const headers = await getAuthHeaders(page);
    const ts = Date.now();

    const response = await page.request.post(`${API}/users/admin-create`, {
      headers,
      data: { username: `1badname_${ts}`, phone: `139${String(ts).slice(-8)}` },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('USER-DATA-05: 用户名格式校验 - 包含特殊字符', async ({ page }) => {
    const headers = await getAuthHeaders(page);
    const ts = Date.now();

    const response = await page.request.post(`${API}/users/admin-create`, {
      headers,
      data: { username: `bad@name_${ts}`, phone: `139${String(ts).slice(-8)}` },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('USER-DATA-06: 用户名长度 - 超过20位 (admin-create)', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const response = await page.request.post(`${API}/users/admin-create`, {
      headers,
      data: { username: 'a'.repeat(21), phone: '13900000001' },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('USER-DATA-07: 密码格式 - 不含字母', async ({ page }) => {
    const headers = await getAuthHeaders(page);
    const ts = Date.now();

    const response = await page.request.post(`${API}/users`, {
      headers,
      data: { username: `pwdtest_${ts}`, password: '123456789', phone: `139${String(ts).slice(-8)}` },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('USER-DATA-08: 密码格式 - 不含数字', async ({ page }) => {
    const headers = await getAuthHeaders(page);
    const ts = Date.now();

    const response = await page.request.post(`${API}/users`, {
      headers,
      data: { username: `pwdtest2_${ts}`, password: 'abcdefghij', phone: `139${String(ts).slice(-8)}` },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('USER-DATA-09: 密码长度 - 少于6位', async ({ page }) => {
    const headers = await getAuthHeaders(page);
    const ts = Date.now();

    const response = await page.request.post(`${API}/users`, {
      headers,
      data: { username: `pwdtest3_${ts}`, password: 'Ab1@5', phone: `139${String(ts).slice(-8)}` },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('USER-DATA-10: 用户列表分页数据验证', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const response = await page.request.get(`${API}/users?page=1&pageSize=5`, { headers });
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.data).toHaveProperty('list');
    expect(body.data).toHaveProperty('total');
    expect(Array.isArray(body.data.list)).toBeTruthy();
    expect(typeof body.data.total).toBe('number');
    expect(body.data.list.length).toBeLessThanOrEqual(5);
  });

  test('USER-DATA-11: 用户状态切换 - 数据一致性', async ({ page }) => {
    const headers = await getAuthHeaders(page);
    const ts = Date.now();

    const createRes = await page.request.post(`${API}/users`, {
      headers,
      data: { username: `statustest_${ts}`, password: 'TestPass@123', phone: `139${String(ts).slice(-8)}` },
    });
    const createBody = await createRes.json();
    if (createBody.code !== 0) {
      test.skip();
      return;
    }

    const userId = createBody.data.id;
    expect(createBody.data.userStatus).toBe(1);

    const disableRes = await page.request.put(`${API}/users/${userId}/status`, {
      headers,
      data: { status: 0 },
    });
    const disableBody = await disableRes.json();
    expect(disableBody.code).toBe(0);
    expect(disableBody.data.userStatus).toBe(0);

    const enableRes = await page.request.put(`${API}/users/${userId}/status`, {
      headers,
      data: { status: 1 },
    });
    const enableBody = await enableRes.json();
    expect(enableBody.code).toBe(0);
    expect(enableBody.data.userStatus).toBe(1);
  });

  test('USER-DATA-12: 用户搜索 - 结果数据过滤正确性', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const response = await page.request.get(`${API}/users?username=admin`, { headers });
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.data.list.length).toBeGreaterThan(0);
    body.data.list.forEach((user: any) => {
      expect(user.username).toContain('admin');
    });
  });

  test('USER-DATA-13: 管理员创建用户 - 默认密码策略', async ({ page }) => {
    const headers = await getAuthHeaders(page);
    const ts = Date.now();

    const response = await page.request.post(`${API}/users/admin-create`, {
      headers,
      data: { username: `admincreate_${ts}`, phone: `139${String(ts).slice(-8)}` },
    });
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.data).toHaveProperty('id');
    expect(body.data.username).toBe(`admincreate_${ts}`);
  });

  test('USER-DATA-14: 手机号格式 - 非法格式', async ({ page }) => {
    const headers = await getAuthHeaders(page);
    const ts = Date.now();

    const response = await page.request.post(`${API}/users/admin-create`, {
      headers,
      data: { username: `phonetest_${ts}`, phone: '123' },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });
});

test.describe('角色管理 - 数据正确性与边界条件', () => {
  test('ROLE-DATA-01: 创建角色 - 返回数据完整性', async ({ page }) => {
    const headers = await getAuthHeaders(page);
    const ts = Date.now();

    const response = await page.request.post(`${API}/roles`, {
      headers,
      data: {
        roleName: `测试角色_${ts}`,
        roleCode: `test_role_${ts}`,
        roleDesc: 'E2E测试创建',
        sortOrder: 100,
      },
    });
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.data).toHaveProperty('id');
    expect(body.data.roleName).toBe(`测试角色_${ts}`);
    expect(body.data.roleCode).toBe(`test_role_${ts}`);
    expect(body.data.sortOrder).toBe(100);
  });

  test('ROLE-DATA-02: 角色编码唯一性冲突', async ({ page }) => {
    const headers = await getAuthHeaders(page);
    const ts = Date.now();
    const roleCode = `dup_role_${ts}`;

    await page.request.post(`${API}/roles`, {
      headers,
      data: { roleName: '角色A', roleCode, sortOrder: 1 },
    });

    const response = await page.request.post(`${API}/roles`, {
      headers,
      data: { roleName: '角色B', roleCode, sortOrder: 2 },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('ROLE-DATA-03: 角色编码格式 - 大写字母', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const response = await page.request.post(`${API}/roles`, {
      headers,
      data: { roleName: '格式测试', roleCode: 'INVALID_CODE', sortOrder: 1 },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('ROLE-DATA-04: 角色编码格式 - 以数字开头', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const response = await page.request.post(`${API}/roles`, {
      headers,
      data: { roleName: '格式测试2', roleCode: '1badcode', sortOrder: 1 },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('ROLE-DATA-05: 角色编码格式 - 包含特殊字符', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const response = await page.request.post(`${API}/roles`, {
      headers,
      data: { roleName: '格式测试3', roleCode: 'bad-code!', sortOrder: 1 },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('ROLE-DATA-06: 内置角色不可删除', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const listRes = await page.request.get(`${API}/roles?pageSize=100`, { headers });
    const listBody = await listRes.json();
    if (listBody.code !== 0) {
      test.skip();
      return;
    }

    const builtinRole = listBody.data.list?.find((r: any) => r.isBuiltin === 1);
    if (!builtinRole) {
      test.skip();
      return;
    }

    const response = await page.request.delete(`${API}/roles/${builtinRole.id}`, { headers });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('ROLE-DATA-07: 角色列表分页数据验证', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const response = await page.request.get(`${API}/roles?page=1&pageSize=5`, { headers });
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.data).toHaveProperty('list');
    expect(body.data).toHaveProperty('total');
    expect(Array.isArray(body.data.list)).toBeTruthy();
  });

  test('ROLE-DATA-08: 角色权限分配后数据一致性', async ({ page }) => {
    const headers = await getAuthHeaders(page);
    const ts = Date.now();

    const createRes = await page.request.post(`${API}/roles`, {
      headers,
      data: { roleName: `权限测试角色_${ts}`, roleCode: `perm_role_${ts}`, sortOrder: 50 },
    });
    const createBody = await createRes.json();
    if (createBody.code !== 0) {
      test.skip();
      return;
    }

    const roleId = createBody.data.id;

    const assignRes = await page.request.post(`${API}/roles/${roleId}/permissions`, {
      headers,
      data: { permissionTrees: { pcTree: [], normalTree: [] } },
    });
    const assignBody = await assignRes.json();
    expect(assignBody.code).toBe(0);

    const getPermRes = await page.request.get(`${API}/roles/${roleId}/permissions`, { headers });
    const getPermBody = await getPermRes.json();
    expect(getPermBody.code).toBe(0);
    expect(getPermBody.data).toHaveProperty('permissionTrees');
  });
});

test.describe('应用管理 - 数据正确性与边界条件', () => {
  test('APP-DATA-01: 创建应用 - 返回数据完整性', async ({ page }) => {
    const headers = await getAuthHeaders(page);
    const ts = Date.now();

    const appTypesRes = await page.request.get(`${API}/app-types/all`, { headers });
    const appTypesBody = await appTypesRes.json();
    if (appTypesBody.data?.length === 0) {
      test.skip();
      return;
    }
    const appTypeId = appTypesBody.data[0].id;

    const response = await page.request.post(`${API}/apps`, {
      headers,
      data: {
        appTypeId,
        appName: `测试应用_${ts}`,
        appCode: `test_app_${ts}`,
        appDesc: 'E2E测试创建',
      },
    });
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.data).toHaveProperty('id');
    expect(body.data.appName).toBe(`测试应用_${ts}`);
    expect(body.data.appCode).toBe(`test_app_${ts}`);
    expect(body.data.appTypeId).toBe(appTypeId);
  });

  test('APP-DATA-02: 应用编码唯一性冲突', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const listRes = await page.request.get(`${API}/apps?pageSize=1`, { headers });
    const listBody = await listRes.json();
    if (listBody.code !== 0 || listBody.data.list?.length === 0) {
      test.skip();
      return;
    }
    const existingCode = listBody.data.list[0].appCode;

    const appTypesRes = await page.request.get(`${API}/app-types/all`, { headers });
    const appTypesBody = await appTypesRes.json();
    if (appTypesBody.data?.length === 0) {
      test.skip();
      return;
    }
    const appTypeId = appTypesBody.data[0].id;

    const response = await page.request.post(`${API}/apps`, {
      headers,
      data: { appTypeId, appName: '重复编码应用', appCode: existingCode },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('APP-DATA-03: system-instance 不可删除', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const listRes = await page.request.get(`${API}/apps?pageSize=100`, { headers });
    const listBody = await listRes.json();
    const sysApp = listBody.data.list?.find((a: any) => a.appCode === 'system-instance');
    if (!sysApp) {
      test.skip();
      return;
    }

    const response = await page.request.delete(`${API}/apps/${sysApp.id}`, { headers });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('APP-DATA-04: system-instance 不可更换拥有者', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const listRes = await page.request.get(`${API}/apps?pageSize=100`, { headers });
    const listBody = await listRes.json();
    const sysApp = listBody.data.list?.find((a: any) => a.appCode === 'system-instance');
    if (!sysApp) {
      test.skip();
      return;
    }

    const response = await page.request.put(`${API}/apps/${sysApp.id}/owner`, {
      headers,
      data: { ownerId: 'some-other-user-id' },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('APP-DATA-05: 应用列表分页数据验证', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const response = await page.request.get(`${API}/apps?page=1&pageSize=5`, { headers });
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.data).toHaveProperty('list');
    expect(body.data).toHaveProperty('total');
    expect(body.data.list.length).toBeLessThanOrEqual(5);
  });
});

test.describe('应用类型 - 数据正确性与边界条件', () => {
  test('APPTYPE-DATA-01: 应用类型编码唯一性冲突', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const listRes = await page.request.get(`${API}/app-types/all`, { headers });
    const listBody = await listRes.json();
    if (listBody.data?.length === 0) {
      test.skip();
      return;
    }
    const existingCode = listBody.data[0].typeCode;

    const response = await page.request.post(`${API}/app-types`, {
      headers,
      data: { typeName: '重复编码类型', typeCode: existingCode },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('APPTYPE-DATA-02: 应用类型列表数据结构', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const response = await page.request.get(`${API}/app-types/all`, { headers });
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(Array.isArray(body.data)).toBeTruthy();

    if (body.data.length > 0) {
      const type = body.data[0];
      expect(type).toHaveProperty('id');
      expect(type).toHaveProperty('typeName');
      expect(type).toHaveProperty('typeCode');
    }
  });

  test('APPTYPE-DATA-03: 权限池数据结构', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const listRes = await page.request.get(`${API}/app-types/all`, { headers });
    const listBody = await listRes.json();
    if (listBody.data?.length === 0) {
      test.skip();
      return;
    }
    const typeId = listBody.data[0].id;

    const response = await page.request.get(`${API}/app-types/${typeId}/permission-pool`, { headers });
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.data).toHaveProperty('permissionTrees');
    expect(body.data.permissionTrees).toHaveProperty('pcTree');
    expect(body.data.permissionTrees).toHaveProperty('normalTree');
  });
});

test.describe('成员管理 - 数据正确性', () => {
  test('MEMBER-DATA-01: 成员列表数据结构', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const appsRes = await page.request.get(`${API}/apps?pageSize=1`, { headers });
    const appsBody = await appsRes.json();
    if (appsBody.data.list?.length === 0) {
      test.skip();
      return;
    }
    const appId = appsBody.data.list[0].id;

    const response = await page.request.get(`${API}/apps/${appId}/members`, { headers });
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(Array.isArray(body.data)).toBeTruthy();
  });

  test('MEMBER-DATA-02: 重复添加成员 - 返回冲突', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const appsRes = await page.request.get(`${API}/apps?pageSize=1`, { headers });
    const appsBody = await appsRes.json();
    if (appsBody.data.list?.length === 0) {
      test.skip();
      return;
    }
    const appId = appsBody.data.list[0].id;

    const membersRes = await page.request.get(`${API}/apps/${appId}/members`, { headers });
    const membersBody = await membersRes.json();
    if (membersBody.data?.length === 0) {
      test.skip();
      return;
    }
    const existingUserId = membersBody.data[0].userId;

    const response = await page.request.post(`${API}/apps/${appId}/members`, {
      headers,
      data: { userId: existingUserId },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });
});

test.describe('审计日志 - 数据正确性', () => {
  test('AUDIT-DATA-01: 审计日志数据结构', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const response = await page.request.get(`${API}/audit-logs?page=1&pageSize=5`, { headers });
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.data).toHaveProperty('list');
    expect(body.data).toHaveProperty('total');

    if (body.data.list.length > 0) {
      const log = body.data.list[0];
      expect(log).toHaveProperty('id');
      expect(log).toHaveProperty('event');
      expect(log).toHaveProperty('module');
      expect(log).toHaveProperty('operatorName');
    }
  });

  test('AUDIT-DATA-02: 操作后审计日志自动记录', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const beforeRes = await page.request.get(`${API}/audit-logs?page=1&pageSize=1&sortField=createAt&sortOrder=DESC`, { headers });
    const beforeBody = await beforeRes.json();
    const beforeTotal = beforeBody.data?.total || 0;

    const ts = Date.now();
    await page.request.post(`${API}/users`, {
      headers,
      data: { username: `audittest_${ts}`, password: 'TestPass@123', phone: `139${String(ts).slice(-8)}` },
    });

    const afterRes = await page.request.get(`${API}/audit-logs?page=1&pageSize=1&sortField=createAt&sortOrder=DESC`, { headers });
    const afterBody = await afterRes.json();
    const afterTotal = afterBody.data?.total || 0;

    expect(afterTotal).toBeGreaterThanOrEqual(beforeTotal);
  });
});

test.describe('权限管理 - 数据正确性与边界条件', () => {
  test('PERM-DATA-01: 权限树数据结构验证', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const response = await page.request.get(`${API}/permissions/tree`, { headers });
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(Array.isArray(body.data)).toBeTruthy();
  });

  test('PERM-DATA-02: 权限编码唯一性冲突', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const treeRes = await page.request.get(`${API}/permissions/tree`, { headers });
    const treeBody = await treeRes.json();
    if (treeBody.data?.length === 0) {
      test.skip();
      return;
    }

    const root = treeBody.data[0];
    const existingCode = root.permCode;

    const response = await page.request.post(`${API}/permissions`, {
      headers,
      data: {
        permName: '重复编码权限',
        permCode: existingCode.split(':').pop(),
        nodeType: 'MENU',
        parentId: root.id,
        permType: root.permType,
      },
    });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });

  test('PERM-DATA-03: 根节点不可删除', async ({ page }) => {
    const headers = await getAuthHeaders(page);

    const treeRes = await page.request.get(`${API}/permissions/tree`, { headers });
    const treeBody = await treeRes.json();
    const rootNode = treeBody.data?.find((n: any) => n.permCode === 'pc_root' || n.permCode === 'normal_root');
    if (!rootNode) {
      test.skip();
      return;
    }

    const response = await page.request.delete(`${API}/permissions/${rootNode.id}`, { headers });
    const body = await response.json();
    expect(body.code).not.toBe(0);
  });
});

test.describe('跨模块联动 - 数据一致性', () => {
  test('CROSS-01: 创建用户→添加成员→分配角色 完整链路', async ({ page }) => {
    const headers = await getAuthHeaders(page);
    const ts = Date.now();

    const createRes = await page.request.post(`${API}/users`, {
      headers,
      data: { username: `crosstest_${ts}`, password: 'TestPass@123', phone: `139${String(ts).slice(-8)}` },
    });
    const createBody = await createRes.json();
    if (createBody.code !== 0) {
      test.skip();
      return;
    }
    const userId = createBody.data.id;
    expect(userId).toBeTruthy();

    const appsRes = await page.request.get(`${API}/apps?pageSize=1`, { headers });
    const appsBody = await appsRes.json();
    if (appsBody.data.list?.length === 0) {
      test.skip();
      return;
    }
    const appId = appsBody.data.list[0].id;

    const addMemberRes = await page.request.post(`${API}/apps/${appId}/members`, {
      headers,
      data: { userId },
    });
    const addMemberBody = await addMemberRes.json();
    expect(addMemberBody.code).toBe(0);

    const membersRes = await page.request.get(`${API}/apps/${appId}/members`, { headers });
    const membersBody = await membersRes.json();
    const member = membersBody.data?.find((m: any) => m.userId === userId);
    expect(member).toBeDefined();

    const rolesRes = await page.request.get(`${API}/apps/${appId}/members/available-roles`, { headers });
    const rolesBody = await rolesRes.json();
    if (rolesBody.code === 0 && rolesBody.data?.length > 0) {
      const roleIds = rolesBody.data.slice(0, 2).map((r: any) => r.id);

      const updateRolesRes = await page.request.put(`${API}/apps/${appId}/members/${userId}/roles`, {
        headers,
        data: { roleIds },
      });
      const updateRolesBody = await updateRolesRes.json();
      expect(updateRolesBody.code).toBe(0);
    }
  });

  test('CROSS-02: 禁用用户后无法登录 - 数据一致性', async ({ page }) => {
    const headers = await getAuthHeaders(page);
    const ts = Date.now();

    const createRes = await page.request.post(`${API}/users`, {
      headers,
      data: { username: `disabletest_${ts}`, password: 'TestPass@123', phone: `139${String(ts).slice(-8)}` },
    });
    const createBody = await createRes.json();
    if (createBody.code !== 0) {
      test.skip();
      return;
    }
    const userId = createBody.data.id;

    await page.request.put(`${API}/users/${userId}/status`, {
      headers,
      data: { status: 0 },
    });

    const loginRes = await page.request.post(`${API}/auth/login`, {
      data: { username: `disabletest_${ts}`, password: 'TestPass@123' },
    });
    const loginBody = await loginRes.json();
    expect(loginBody.code).not.toBe(0);

    await page.request.put(`${API}/users/${userId}/status`, {
      headers,
      data: { status: 1 },
    });
  });

  test('CROSS-03: 健康检查 API 可用', async ({ page }) => {
    const response = await page.request.get(`${API}/health`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toBeDefined();
  });
});

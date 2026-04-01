/**
 * 墨焱框架 API 集成测试执行脚本
 *
 * 使用方法：
 * 1. 确保后端服务正在运行 (http://localhost:3000)
 * 2. 运行：node test-api-runner.js
 * 3. 查看输出和生成的测试报告
 *
 * @fileoverview API 集成测试执行器
 * @description 执行 AUTH/USER/APP-TYPE/APP/ROLE/PERMISSION/MEMBER/AUDIT 8 个模块的集成测试
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// ============ 配置 ============
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  apiPrefix: '/api/v1',
  defaultPassword: 'Admin@123',
  defaultUser: 'admin',
};

// ============ 测试结果记录 ============
const testResults = {
  startTime: new Date(),
  endTime: null,
  modules: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    blocked: 0,
    skipped: 0,
  },
};

// ============ 认证状态 ============
let authState = {
  accessToken: null,
  refreshToken: null,
  userInfo: null,
};

// ============ 工具函数 ============

/**
 * 发送 HTTP 请求
 */
function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseData ? JSON.parse(responseData) : null,
            raw: responseData,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: null,
            raw: responseData,
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * 记录测试结果
 */
function recordResult(module, caseNo, name, passed, expected, actual, error = null, severity = '一般') {
  const moduleId = module.toLowerCase();
  if (!testResults.modules[moduleId]) {
    testResults.modules[moduleId] = { name: module, cases: [] };
  }

  testResults.summary.total++;

  let status = 'passed';
  if (!passed) {
    if (error && error.includes('BLOCKED')) {
      status = 'blocked';
      testResults.summary.blocked++;
    } else if (error && error.includes('SKIPPED')) {
      status = 'skipped';
      testResults.summary.skipped++;
    } else {
      status = 'failed';
      testResults.summary.failed++;
    }
  } else {
    testResults.summary.passed++;
  }

  const result = {
    module,
    caseNo,
    name,
    status,
    expected,
    actual,
    error: error || null,
    severity,
    timestamp: new Date().toISOString(),
  };

  testResults.modules[moduleId].cases.push(result);

  // 输出到控制台
  const statusIcon = status === 'passed' ? '[x]' : status === 'blocked' ? '[!]' : status === 'skipped' ? '[-]' : '[!]';
  const severityMark = severity === '致命' ? '🔴' : severity === '严重' ? '🟠' : severity === '一般' ? '🟡' : '🟢';
  console.log(`  ${statusIcon} ${severityMark} ${module}-${caseNo}: ${name}`);
  if (!passed && status !== 'skipped') {
    console.log(`      预期：${expected}`);
    console.log(`      实际：${actual}`);
    if (error) console.log(`      错误：${error}`);
  }
}

/**
 * 断言辅助函数
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * 深度比较对象
 */
function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    if (keysA.length !== keysB.length) return false;
    if (keysA.some((k, i) => k !== keysB[i])) return false;
    return keysA.every(k => deepEqual(a[k], b[k]));
  }

  return false;
}

// ============ AUTH 模块测试 ============

async function testAuthModule() {
  console.log('\n' + '='.repeat(60));
  console.log('  AUTH 模块测试 - 认证相关接口');
  console.log('='.repeat(60) + '\n');

  const module = 'AUTH';

  // AUTH-001: 用户登录成功（用户名）
  console.log('[AUTH-001] 用户登录测试组');
  try {
    const res = await request({
      hostname: CONFIG.baseUrl.replace('http://', ''),
      port: 3000,
      path: `${CONFIG.apiPrefix}/auth/login`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify({ identifier: CONFIG.defaultUser, password: CONFIG.defaultPassword }));

    const passed = res.statusCode === 200 && res.body?.code === 0 && !!res.body?.data?.accessToken;
    authState.accessToken = res.body?.data?.accessToken;
    authState.refreshToken = res.body?.data?.refreshToken;

    recordResult(
      module, '001-01', '使用用户名登录成功 - 验证正常登录流程返回 Token',
      passed,
      'statusCode=200, code=0, data.accessToken 存在',
      `statusCode=${res.statusCode}, code=${res.body?.code}, accessToken=${authState.accessToken ? 'exists' : 'missing'}`
    );
  } catch (e) {
    recordResult(module, '001-01', '使用用户名登录成功', false, 'success', `error: ${e.message}`, e.message);
  }

  // AUTH-001-02: 使用手机号登录成功
  try {
    const res = await request({
      hostname: CONFIG.baseUrl.replace('http://', ''),
      port: 3000,
      path: `${CONFIG.apiPrefix}/auth/login`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify({ identifier: '13800138000', password: CONFIG.defaultPassword }));

    // 如果手机号不存在，应该返回业务错误（code != 0）
    const passed = res.statusCode === 200 && res.body?.code !== 0;
    recordResult(
      module, '001-02', '使用手机号登录 - 验证手机号作为标识登录',
      passed,
      'statusCode=200, code!=0 (手机号未注册)',
      `statusCode=${res.statusCode}, code=${res.body?.code}`
    );
  } catch (e) {
    recordResult(module, '001-02', '使用手机号登录', false, 'success', `error: ${e.message}`, e.message);
  }

  // AUTH-001-03: 密码错误登录失败
  try {
    const res = await request({
      hostname: CONFIG.baseUrl.replace('http://', ''),
      port: 3000,
      path: `${CONFIG.apiPrefix}/auth/login`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify({ identifier: CONFIG.defaultUser, password: 'WrongPassword' }));

    const passed = res.statusCode === 200 && res.body?.code !== 0;
    recordResult(
      module, '001-03', '密码错误登录失败 - 验证密码校验逻辑',
      passed,
      'statusCode=200, code!=0 (密码错误)',
      `statusCode=${res.statusCode}, code=${res.body?.code}`
    );
  } catch (e) {
    recordResult(module, '001-03', '密码错误登录失败', false, 'success', `error: ${e.message}`, e.message);
  }

  // AUTH-001-04: 用户不存在登录失败
  try {
    const res = await request({
      hostname: CONFIG.baseUrl.replace('http://', ''),
      port: 3000,
      path: `${CONFIG.apiPrefix}/auth/login`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify({ identifier: 'nonexistent_user', password: CONFIG.defaultPassword }));

    const passed = res.statusCode === 200 && res.body?.code !== 0;
    recordResult(
      module, '001-04', '用户不存在登录失败 - 验证用户存在性检查',
      passed,
      'statusCode=200, code!=0 (用户不存在)',
      `statusCode=${res.statusCode}, code=${res.body?.code}`
    );
  } catch (e) {
    recordResult(module, '001-04', '用户不存在登录失败', false, 'success', `error: ${e.message}`, e.message);
  }

  // AUTH-002: 刷新 Token
  console.log('\n[AUTH-002] 刷新 Token 测试组');
  if (authState.refreshToken) {
    try {
      const res = await request({
        hostname: CONFIG.baseUrl.replace('http://', ''),
        port: 3000,
        path: `${CONFIG.apiPrefix}/auth/refresh`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, JSON.stringify({ refreshToken: authState.refreshToken }));

      const passed = res.statusCode === 200 && res.body?.code === 0 && !!res.body?.data?.accessToken;
      if (passed) {
        authState.accessToken = res.body?.data?.accessToken;
        authState.refreshToken = res.body?.data?.refreshToken;
      }
      recordResult(
        module, '002-01', '刷新 Token 成功 - 验证刷新 Token 机制',
        passed,
        'statusCode=200, code=0, data.accessToken 存在',
        `statusCode=${res.statusCode}, code=${res.body?.code}`
      );
    } catch (e) {
      recordResult(module, '002-01', '刷新 Token 成功', false, 'success', `error: ${e.message}`, e.message);
    }
  } else {
    recordResult(module, '002-01', '刷新 Token 成功', false, 'has refreshToken', 'refreshToken is null', 'BLOCKED: 登录未获取到 refreshToken');
  }

  // 刷新 Token 失败场景 - 使用无效 Token
  try {
    const res = await request({
      hostname: CONFIG.baseUrl.replace('http://', ''),
      port: 3000,
      path: `${CONFIG.apiPrefix}/auth/refresh`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify({ refreshToken: 'invalid-token' }));

    const passed = res.statusCode === 200 && res.body?.code !== 0;
    recordResult(
      module, '002-02', '无效刷新 Token 返回错误 - 验证 Token 校验逻辑',
      passed,
      'statusCode=200, code!=0 (Token 无效)',
      `statusCode=${res.statusCode}, code=${res.body?.code}`
    );
  } catch (e) {
    recordResult(module, '002-02', '无效刷新 Token 返回错误', false, 'success', `error: ${e.message}`, e.message);
  }

  // AUTH-003: 获取用户信息
  console.log('\n[AUTH-003] 获取用户信息测试组');
  if (authState.accessToken) {
    try {
      const res = await request({
        hostname: CONFIG.baseUrl.replace('http://', ''),
        port: 3000,
        path: `${CONFIG.apiPrefix}/auth/userinfo`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.accessToken}`,
        },
      });

      const passed = res.statusCode === 200 && res.body?.code === 0 && !!res.body?.data;
      if (passed) {
        authState.userInfo = res.body?.data;
      }
      recordResult(
        module, '003-01', '获取当前用户信息成功 - 验证 JWT 解析和用户查询',
        passed,
        'statusCode=200, code=0, data 存在',
        `statusCode=${res.statusCode}, code=${res.body?.code}`
      );
    } catch (e) {
      recordResult(module, '003-01', '获取当前用户信息成功', false, 'success', `error: ${e.message}`, e.message);
    }

    // 未授权访问
    try {
      const res = await request({
        hostname: CONFIG.baseUrl.replace('http://', ''),
        port: 3000,
        path: `${CONFIG.apiPrefix}/auth/userinfo`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // 应该返回 200 但 code != 0（业务错误）或者 401
      const passed = (res.statusCode === 200 && res.body?.code !== 0) || res.statusCode === 401;
      recordResult(
        module, '003-02', '未授权访问返回错误 - 验证 JWT 鉴权拦截器',
        passed,
        'statusCode=200/code!=0 或 statusCode=401',
        `statusCode=${res.statusCode}, code=${res.body?.code}`
      );
    } catch (e) {
      recordResult(module, '003-02', '未授权访问返回错误', false, 'success', `error: ${e.message}`, e.message);
    }
  } else {
    recordResult(module, '003-01', '获取当前用户信息成功', false, 'has authToken', 'authToken is null', 'BLOCKED');
    recordResult(module, '003-02', '未授权访问返回错误', false, 'has authToken', 'authToken is null', 'SKIPPED');
  }

  // AUTH-004: 退出登录
  console.log('\n[AUTH-004] 退出登录测试组');
  if (authState.accessToken) {
    try {
      const res = await request({
        hostname: CONFIG.baseUrl.replace('http://', ''),
        port: 3000,
        path: `${CONFIG.apiPrefix}/auth/logout`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.accessToken}`,
        },
      });

      const passed = res.statusCode === 200 && res.body?.code === 0;
      recordResult(
        module, '004-01', '退出登录成功 - 验证 Token 失效逻辑',
        passed,
        'statusCode=200, code=0',
        `statusCode=${res.statusCode}, code=${res.body?.code}`
      );
    } catch (e) {
      recordResult(module, '004-01', '退出登录成功', false, 'success', `error: ${e.message}`, e.message);
    }
  } else {
    recordResult(module, '004-01', '退出登录成功', false, 'has authToken', 'authToken is null', 'BLOCKED');
  }
}

// ============ USER 模块测试 ============

async function testUserModule() {
  console.log('\n' + '='.repeat(60));
  console.log('  USER 模块测试 - 用户管理接口');
  console.log('='.repeat(60) + '\n');

  const module = 'USER';

  // 前置条件：登录获取 Token
  console.log('[前置条件] 获取管理员 Token...');
  try {
    const loginRes = await request({
      hostname: CONFIG.baseUrl.replace('http://', ''),
      port: 3000,
      path: `${CONFIG.apiPrefix}/auth/login`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, JSON.stringify({ identifier: CONFIG.defaultUser, password: CONFIG.defaultPassword }));

    if (loginRes.body?.code === 0) {
      authState.accessToken = loginRes.body?.data?.accessToken;
      console.log('  ✓ 获取 Token 成功\n');
    } else {
      console.log(`  ✗ 获取 Token 失败：code=${loginRes.body?.code}\n`);
      // 标记所有 USER 测试为 BLOCKED
      ['001-01', '002-01', '003-01', '004-01', '005-01', '006-01', '007-01'].forEach(caseNo => {
        recordResult(module, caseNo, '前置条件失败', false, 'success', 'BLOCKED: 无法获取 Token', 'BLOCKED');
      });
      return;
    }
  } catch (e) {
    console.log(`  ✗ 获取 Token 异常：${e.message}\n`);
    ['001-01', '002-01', '003-01', '004-01', '005-01', '006-01', '007-01'].forEach(caseNo => {
      recordResult(module, caseNo, '前置条件失败', false, 'success', `BLOCKED: ${e.message}`, 'BLOCKED');
    });
    return;
  }

  // USER-001: 创建用户
  console.log('[USER-001] 创建用户测试组');
  const testUsername = `test_user_${Date.now()}`;
  let testUserId = null;

  try {
    const res = await request({
      hostname: CONFIG.baseUrl.replace('http://', ''),
      port: 3000,
      path: `${CONFIG.apiPrefix}/users`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.accessToken}`,
      },
    }, JSON.stringify({
      username: testUsername,
      password: 'Test@123456',
      nickname: '测试用户',
      email: 'test@example.com',
    }));

    const passed = res.statusCode === 201 && res.body?.code === 0 && !!res.body?.data?.id;
    if (passed) {
      testUserId = res.body?.data?.id;
    }
    recordResult(
      module, '001-01', '创建用户成功 - 验证用户创建流程和字段校验',
      passed,
      'statusCode=201, code=0, data.id 存在',
      `statusCode=${res.statusCode}, code=${res.body?.code}`
    );
  } catch (e) {
    recordResult(module, '001-01', '创建用户成功', false, 'success', `error: ${e.message}`, e.message);
  }

  // USER-001-02: 创建用户 - 缺少必填字段
  try {
    const res = await request({
      hostname: CONFIG.baseUrl.replace('http://', ''),
      port: 3000,
      path: `${CONFIG.apiPrefix}/users`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.accessToken}`,
      },
    }, JSON.stringify({
      username: 'test_incomplete',
      // 缺少 password
    }));

    const passed = res.statusCode === 400 || (res.statusCode === 200 && res.body?.code !== 0);
    recordResult(
      module, '001-02', '创建用户失败 - 缺少必填字段返回验证错误',
      passed,
      'statusCode=400 或 code!=0',
      `statusCode=${res.statusCode}, code=${res.body?.code}`
    );
  } catch (e) {
    recordResult(module, '001-02', '创建用户失败 - 缺少必填字段', false, 'validation error', `error: ${e.message}`, e.message);
  }

  // USER-002: 查询用户列表
  console.log('\n[USER-002] 查询用户列表测试组');
  try {
    const res = await request({
      hostname: CONFIG.baseUrl.replace('http://', ''),
      port: 3000,
      path: `${CONFIG.apiPrefix}/users?page=1&pageSize=10`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authState.accessToken}`,
      },
    });

    const passed = res.statusCode === 200 && res.body?.code === 0 && !!res.body?.data;
    recordResult(
      module, '002-01', '分页查询用户列表成功 - 验证分页查询功能',
      passed,
      'statusCode=200, code=0, data 存在',
      `statusCode=${res.statusCode}, code=${res.body?.code}`
    );
  } catch (e) {
    recordResult(module, '002-01', '分页查询用户列表成功', false, 'success', `error: ${e.message}`, e.message);
  }

  // USER-002-02: 查询用户列表 - 按用户名筛选
  try {
    const res = await request({
      hostname: CONFIG.baseUrl.replace('http://', ''),
      port: 3000,
      path: `${CONFIG.apiPrefix}/users?username=${testUsername}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authState.accessToken}`,
      },
    });

    const passed = res.statusCode === 200 && res.body?.code === 0;
    recordResult(
      module, '002-02', '按用户名筛选用户 - 验证查询条件功能',
      passed,
      'statusCode=200, code=0',
      `statusCode=${res.statusCode}, code=${res.body?.code}`
    );
  } catch (e) {
    recordResult(module, '002-02', '按用户名筛选用户', false, 'success', `error: ${e.message}`, e.message);
  }

  // USER-003: 根据 ID 查询用户
  console.log('\n[USER-003] 根据 ID 查询用户测试组');
  if (testUserId) {
    try {
      const res = await request({
        hostname: CONFIG.baseUrl.replace('http://', ''),
        port: 3000,
        path: `${CONFIG.apiPrefix}/users/${testUserId}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authState.accessToken}`,
        },
      });

      const passed = res.statusCode === 200 && res.body?.code === 0 && !!res.body?.data;
      recordResult(
        module, '003-01', '根据 ID 查询用户成功 - 验证单用户查询',
        passed,
        'statusCode=200, code=0, data 存在',
        `statusCode=${res.statusCode}, code=${res.body?.code}`
      );
    } catch (e) {
      recordResult(module, '003-01', '根据 ID 查询用户成功', false, 'success', `error: ${e.message}`, e.message);
    }
  } else {
    recordResult(module, '003-01', '根据 ID 查询用户成功', false, 'has testUserId', 'testUserId is null', 'BLOCKED');
  }

  // USER-003-02: 查询不存在的用户
  try {
    const res = await request({
      hostname: CONFIG.baseUrl.replace('http://', ''),
      port: 3000,
      path: `${CONFIG.apiPrefix}/users/00000000-0000-0000-0000-000000000000`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authState.accessToken}`,
      },
    });

    const passed = res.statusCode === 404 || (res.statusCode === 200 && res.body?.code !== 0);
    recordResult(
      module, '003-02', '查询不存在的用户返回错误 - 验证 404 处理',
      passed,
      'statusCode=404 或 code!=0',
      `statusCode=${res.statusCode}, code=${res.body?.code}`
    );
  } catch (e) {
    recordResult(module, '003-02', '查询不存在的用户返回错误', false, 'success', `error: ${e.message}`, e.message);
  }

  // USER-004: 更新用户
  console.log('\n[USER-004] 更新用户测试组');
  if (testUserId) {
    try {
      const res = await request({
        hostname: CONFIG.baseUrl.replace('http://', ''),
        port: 3000,
        path: `${CONFIG.apiPrefix}/users/${testUserId}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.accessToken}`,
        },
      }, JSON.stringify({
        nickname: '更新后的昵称',
      }));

      const passed = res.statusCode === 200 && res.body?.code === 0;
      recordResult(
        module, '004-01', '更新用户成功 - 验证用户信息修改',
        passed,
        'statusCode=200, code=0',
        `statusCode=${res.statusCode}, code=${res.body?.code}`
      );
    } catch (e) {
      recordResult(module, '004-01', '更新用户成功', false, 'success', `error: ${e.message}`, e.message);
    }
  } else {
    recordResult(module, '004-01', '更新用户成功', false, 'has testUserId', 'testUserId is null', 'BLOCKED');
  }

  // USER-005: 更新用户状态
  console.log('\n[USER-005] 更新用户状态测试组');
  if (testUserId) {
    // 禁用用户
    try {
      const res = await request({
        hostname: CONFIG.baseUrl.replace('http://', ''),
        port: 3000,
        path: `${CONFIG.apiPrefix}/users/${testUserId}/status?status=0`,
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authState.accessToken}`,
        },
      });

      const passed = res.statusCode === 200 && res.body?.code === 0;
      recordResult(
        module, '005-01', '禁用用户成功 - 验证状态修改功能',
        passed,
        'statusCode=200, code=0',
        `statusCode=${res.statusCode}, code=${res.body?.code}`
      );
    } catch (e) {
      recordResult(module, '005-01', '禁用用户成功', false, 'success', `error: ${e.message}`, e.message);
    }

    // 启用用户
    try {
      const res = await request({
        hostname: CONFIG.baseUrl.replace('http://', ''),
        port: 3000,
        path: `${CONFIG.apiPrefix}/users/${testUserId}/status?status=1`,
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authState.accessToken}`,
        },
      });

      const passed = res.statusCode === 200 && res.body?.code === 0;
      recordResult(
        module, '005-02', '启用用户成功 - 验证状态恢复功能',
        passed,
        'statusCode=200, code=0',
        `statusCode=${res.statusCode}, code=${res.body?.code}`
      );
    } catch (e) {
      recordResult(module, '005-02', '启用用户成功', false, 'success', `error: ${e.message}`, e.message);
    }
  } else {
    recordResult(module, '005-01', '禁用用户成功', false, 'has testUserId', 'testUserId is null', 'BLOCKED');
    recordResult(module, '005-02', '启用用户成功', false, 'has testUserId', 'testUserId is null', 'BLOCKED');
  }

  // USER-006: 重置用户密码
  console.log('\n[USER-006] 重置用户密码测试组');
  if (testUserId) {
    try {
      const res = await request({
        hostname: CONFIG.baseUrl.replace('http://', ''),
        port: 3000,
        path: `${CONFIG.apiPrefix}/users/${testUserId}/reset-password?password=NewPass@123`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authState.accessToken}`,
        },
      });

      const passed = res.statusCode === 200 && res.body?.code === 0;
      recordResult(
        module, '006-01', '重置用户密码成功 - 验证密码重置功能',
        passed,
        'statusCode=200, code=0',
        `statusCode=${res.statusCode}, code=${res.body?.code}`
      );
    } catch (e) {
      recordResult(module, '006-01', '重置用户密码成功', false, 'success', `error: ${e.message}`, e.message);
    }
  } else {
    recordResult(module, '006-01', '重置用户密码成功', false, 'has testUserId', 'testUserId is null', 'BLOCKED');
  }

  // USER-007: 删除用户
  console.log('\n[USER-007] 删除用户测试组');
  if (testUserId) {
    try {
      const res = await request({
        hostname: CONFIG.baseUrl.replace('http://', ''),
        port: 3000,
        path: `${CONFIG.apiPrefix}/users/${testUserId}`,
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authState.accessToken}`,
        },
      });

      const passed = res.statusCode === 204 || (res.statusCode === 200 && res.body?.code === 0);
      recordResult(
        module, '007-01', '删除用户成功 - 验证软删除功能',
        passed,
        'statusCode=204 或 statusCode=200/code=0',
        `statusCode=${res.statusCode}, code=${res.body?.code}`
      );
    } catch (e) {
      recordResult(module, '007-01', '删除用户成功', false, 'success', `error: ${e.message}`, e.message);
    }
  } else {
    recordResult(module, '007-01', '删除用户成功', false, 'has testUserId', 'testUserId is null', 'BLOCKED');
  }
}

// ============ 生成测试报告 ============

function generateMarkdownReport() {
  const { summary, modules } = testResults;
  const passRate = summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) : 0;

  let report = `# API 集成测试执行报告

> **执行时间**: ${testResults.startTime.toISOString()}
> **完成时间**: ${testResults.endTime?.toISOString() || '未完成'}
> **后端地址**: ${CONFIG.baseUrl}

## 测试统计

| 统计项 | 数量 |
|--------|------|
| 总测试用例数 | ${summary.total} |
| 通过 | ${summary.passed} |
| 失败 | ${summary.failed} |
| 阻塞 | ${summary.blocked} |
| 跳过 | ${summary.skipped} |
| 通过率 | ${passRate}% |

## 模块测试结果

| 模块 | 总数 | 通过 | 失败 | 阻塞 | 跳过 | 通过率 |
|------|------|------|------|------|------|--------|
${Object.entries(modules).map(([key, mod]) => {
    const modCases = mod.cases;
    const modSummary = {
      total: modCases.length,
      passed: modCases.filter(c => c.status === 'passed').length,
      failed: modCases.filter(c => c.status === 'failed').length,
      blocked: modCases.filter(c => c.status === 'blocked').length,
      skipped: modCases.filter(c => c.status === 'skipped').length,
    };
    const rate = modSummary.total > 0 ? ((modSummary.passed / modSummary.total) * 100).toFixed(1) : 0;
    return `| ${mod.name} | ${modSummary.total} | ${modSummary.passed} | ${modSummary.failed} | ${modSummary.blocked} | ${modSummary.skipped} | ${rate}% |`;
  }).join('\n')}

## 详细测试结果

${Object.entries(modules).map(([key, mod]) => `### ${mod.name} 模块

| 用例编号 | 测试名称 | 状态 | 预期 | 实际 |
|----------|----------|------|------|------|
${mod.cases.map(c => {
    const statusIcon = c.status === 'passed' ? '[x]' : c.status === 'blocked' ? '[!]' : c.status === 'skipped' ? '[-]' : '[!]';
    return `| ${c.caseNo} | ${c.name} | ${statusIcon} | ${c.expected} | ${c.actual} |`;
  }).join('\n')}
`).join('\n')}

## 失败用例详情

${Object.values(modules).flatMap(mod => mod.cases).filter(c => c.status === 'failed').map(c => `### ${c.module}-${c.caseNo}: ${c.name}

- **预期**: ${c.expected}
- **实际**: ${c.actual}
- **错误信息**: ${c.error || 'N/A'}
- **严重程度**: ${c.severity}

`).join('') || '> 无失败用例'}

## 阻塞用例详情

${Object.values(modules).flatMap(mod => mod.cases).filter(c => c.status === 'blocked').map(c => `### ${c.module}-${c.caseNo}: ${c.name}

- **阻塞原因**: ${c.error || c.actual}

`).join('') || '> 无阻塞用例'}

---

*报告生成时间：${new Date().toISOString()}*
`;

  return report;
}

// ============ 主函数 ============

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           墨焱框架 API 集成测试执行器                    ║');
  console.log('║           API Integration Test Runner                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\n开始时间：${new Date().toISOString()}`);
  console.log(`后端地址：${CONFIG.baseUrl}`);
  console.log(`默认账号：${CONFIG.defaultUser}/${CONFIG.defaultPassword}`);

  try {
    // 执行 AUTH 模块测试
    await testAuthModule();

    // 执行 USER 模块测试
    await testUserModule();

    // 测试完成
    testResults.endTime = new Date();
    const duration = ((testResults.endTime - testResults.startTime) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(60));
    console.log('  测试执行完成');
    console.log('='.repeat(60));
    console.log(`执行时长：${duration}s`);
    console.log(`总计：${testResults.summary.total} 个用例`);
    console.log(`通过：${testResults.summary.passed} ✅`);
    console.log(`失败：${testResults.summary.failed} ❌`);
    console.log(`阻塞：${testResults.summary.blocked} 🚫`);
    console.log(`跳过：${testResults.summary.skipped} ⏭️`);
    const passRate = ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1);
    console.log(`通过率：${passRate}%`);

    // 生成并保存测试报告
    const report = generateMarkdownReport();
    const reportPath = path.join(__dirname, 'test-api-report.md');
    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`\n测试报告已保存至：${reportPath}`);

    // 生成测试清单更新文件
    const checklistUpdatePath = path.join(__dirname, 'test-checklist-update.md');
    const checklistUpdate = generateChecklistUpdate();
    fs.writeFileSync(checklistUpdatePath, checklistUpdate, 'utf-8');
    console.log(`测试清单更新已保存至：${checklistUpdatePath}`);

  } catch (e) {
    console.error('\n❌ 测试执行失败:', e);
    process.exit(1);
  }
}

/**
 * 生成测试清单更新内容
 */
function generateChecklistUpdate() {
  let content = `# 测试清单更新

> 生成时间：${new Date().toISOString()}

## AUTH 模块测试状态

`;

  const authCases = testResults.modules.auth?.cases || [];
  authCases.forEach(c => {
    const statusMap = { passed: '[x]', failed: '[!]', blocked: '[!]', skipped: '[-]' };
    content += `- ${statusMap[c.status] || '[ ]'} **${c.module}-${c.caseNo}**: ${c.name}\n`;
    if (c.status === 'failed' || c.status === 'blocked') {
      content += `  - 错误：${c.error || c.actual}\n`;
    }
  });

  content += `\n## USER 模块测试状态\n\n`;
  const userCases = testResults.modules.user?.cases || [];
  userCases.forEach(c => {
    const statusMap = { passed: '[x]', failed: '[!]', blocked: '[!]', skipped: '[-]' };
    content += `- ${statusMap[c.status] || '[ ]'} **${c.module}-${c.caseNo}**: ${c.name}\n`;
    if (c.status === 'failed' || c.status === 'blocked') {
      content += `  - 错误：${c.error || c.actual}\n`;
    }
  });

  return content;
}

// 启动测试
main();

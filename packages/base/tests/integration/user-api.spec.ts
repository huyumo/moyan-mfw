/**
 * @fileoverview 用户模块集成测试
 * @description 测试 /api/users 相关接口的完整功能
 *
 * 测试用例覆盖:
 * - USER-01: 创建用户 (5 个子场景)
 * - USER-02: 查询用户列表 (5 个子场景)
 * - USER-03: 根据 ID 查询用户 (3 个子场景)
 * - USER-04: 更新用户 (4 个子场景)
 * - USER-05: 删除用户 (3 个子场景)
 * - USER-06: 更新用户状态 (3 个子场景)
 * - USER-07: 重置用户密码 (2 个子场景)
 */

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  login,
  generateUniqueIdentifier,
} from '../setup';

describe('用户模块集成测试 (User API Integration Tests)', () => {
  let app: INestApplication;
  let adminToken: string;
  let testUserId: string;
  let createdUserId: string;

  // 测试前启动应用并登录
  beforeAll(async () => {
    app = await createTestApp();

    // 获取 admin token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'Admin@123',
      });
    adminToken = loginResponse.body.data.accessToken;
  });

  // 测试完成后关闭应用
  afterAll(async () => {
    await app?.close();
  });

  // ============================================================================
  // USER-01: 创建用户测试
  // ============================================================================
  describe('USER-01: 创建用户', () => {
    describe('USER-01-01: 创建用户成功', () => {
      it('应该创建用户成功', async () => {
        const uniqueId = generateUniqueIdentifier('newuser');
        const response = await request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            username: uniqueId,
            password: 'NewUser@123',
            nickname: '新用户',
            phone: `139${Date.now() % 100000000}`.padStart(11, '0'),
            email: `${uniqueId}@example.com`,
            gender: 1,
          })
          .expect(201);

        expect(response.body.code).toBe(0);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.id).toBeDefined();
        expect(response.body.data.username).toBe(uniqueId);
        expect(response.body.data.passwordHash).toBeUndefined();

        createdUserId = response.body.data.id;
      });
    });

    describe('USER-01-02: 用户名已存在创建失败', () => {
      it('应该返回用户名已存在', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            username: 'admin', // admin 已存在
            password: 'NewUser@123',
            nickname: '重复用户',
          })
          .expect(409);

        expect(response.body.code).toBe(10002);
        expect(response.body.message).toContain('已存在');
      });
    });

    describe('USER-01-03: 密码格式不符创建失败', () => {
      it('应该返回密码格式错误', async () => {
        const uniqueId = generateUniqueIdentifier('weakuser');
        const response = await request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            username: uniqueId,
            password: '123456', // 密码太简单
            nickname: '弱密码用户',
          })
          .expect(400);

        expect(response.body.code).toBe(10001);
        expect(response.body.details).toBeDefined();
      });
    });

    describe('USER-01-04: 必填字段缺失创建失败', () => {
      it('应该返回参数错误', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            // 缺少 username 和 password
            nickname: '不完整用户',
          })
          .expect(400);

        expect(response.body.code).toBe(10001);
      });
    });

    describe('USER-01-05: 无权限创建用户返回 403', () => {
      it('应该返回无权限访问', async () => {
        // 使用 test 用户登录（仅有 VIEW 权限）
        const testLoginResponse = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            username: 'test',
            password: 'Test@123',
          });

        const testToken = testLoginResponse.body.data.accessToken;
        const uniqueId = generateUniqueIdentifier('nopermuser');

        const response = await request(app.getHttpServer())
          .post('/api/users')
          .set('Authorization', `Bearer ${testToken}`)
          .send({
            username: uniqueId,
            password: 'NewUser@123',
            nickname: '无权限用户',
          })
          .expect(403);

        expect(response.body.code).toBe(10003);
      });
    });
  });

  // ============================================================================
  // USER-02: 查询用户列表测试
  // ============================================================================
  describe('USER-02: 查询用户列表', () => {
    describe('USER-02-01: 分页查询用户列表成功', () => {
      it('应该返回分页用户列表', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/users?page=1&pageSize=10')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.list).toBeDefined();
        expect(Array.isArray(response.body.data.list)).toBe(true);
        expect(response.body.data.total).toBeGreaterThanOrEqual(2); // 至少 admin 和 test
        expect(response.body.data.page).toBe(1);
        expect(response.body.data.pageSize).toBe(10);
      });
    });

    describe('USER-02-02: 按用户名搜索', () => {
      it('应该返回匹配的用户', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/users?username=admin&page=1&pageSize=10')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data.total).toBeGreaterThanOrEqual(1);
        expect(response.body.data.list.some((u: any) => u.username === 'admin')).toBe(true);
      });
    });

    describe('USER-02-03: 按状态筛选', () => {
      it('应该返回指定状态的用户', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/users?userStatus=1&page=1&pageSize=10')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data.list.every((u: any) => u.userStatus === 1)).toBe(true);
      });
    });

    describe('USER-02-04: 查询第一页', () => {
      it('应该返回第一页数据', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/users?page=1&pageSize=5')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data.list.length).toBeLessThanOrEqual(5);
        expect(response.body.data.hasPrev).toBe(false);
      });
    });

    describe('USER-02-05: 查询超出范围的页码', () => {
      it('应该返回空列表', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/users?page=9999&pageSize=10')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data.list).toEqual([]);
        expect(response.body.data.hasPrev).toBe(true);
      });
    });
  });

  // ============================================================================
  // USER-03: 根据 ID 查询用户
  // ============================================================================
  describe('USER-03: 根据 ID 查询用户', () => {
    describe('USER-03-01: 查询用户详情成功', () => {
      it('应该返回用户详情', async () => {
        // 先获取 admin 用户 ID
        const listResponse = await request(app.getHttpServer())
          .get('/api/users?username=admin&page=1&pageSize=1')
          .set('Authorization', `Bearer ${adminToken}`);

        const adminId = listResponse.body.data.list[0].id;

        const response = await request(app.getHttpServer())
          .get(`/api/users/${adminId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data.id).toBe(adminId);
        expect(response.body.data.username).toBe('admin');
      });
    });

    describe('USER-03-02: 用户不存在返回 404', () => {
      it('应该返回用户不存在', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/users/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.code).toBe(10004);
      });
    });

    describe('USER-03-03: 无效 UUID 格式返回 400', () => {
      it('应该返回参数错误', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/users/invalid-uuid')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.code).toBe(10001);
      });
    });
  });

  // ============================================================================
  // USER-04: 更新用户
  // ============================================================================
  describe('USER-04: 更新用户', () => {
    let userToUpdateId: string;

    beforeAll(async () => {
      // 获取一个用于测试更新的用户 ID
      const listResponse = await request(app.getHttpServer())
        .get('/api/users?username=test&page=1&pageSize=1')
        .set('Authorization', `Bearer ${adminToken}`);

      if (listResponse.body.data.list.length > 0) {
        userToUpdateId = listResponse.body.data.list[0].id;
      }
    });

    describe('USER-04-01: 更新用户信息成功', () => {
      it('应该更新用户成功', async () => {
        const response = await request(app.getHttpServer())
          .put(`/api/users/${userToUpdateId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            nickname: '更新后的昵称',
            gender: 2,
          })
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data.nickname).toBe('更新后的昵称');
      });
    });

    describe('USER-04-02: 更新不存在的用户返回 404', () => {
      it('应该返回用户不存在', async () => {
        const response = await request(app.getHttpServer())
          .put('/api/users/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            nickname: '新昵称',
          })
          .expect(404);

        expect(response.body.code).toBe(10004);
      });
    });

    describe('USER-04-03: 必填字段验证', () => {
      it('应该通过验证', async () => {
        const response = await request(app.getHttpServer())
          .put(`/api/users/${userToUpdateId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            nickname: '', // 空昵称应该允许
          })
          .expect(200);

        expect(response.body.code).toBe(0);
      });
    });
  });

  // ============================================================================
  // USER-05: 删除用户
  // ============================================================================
  describe('USER-05: 删除用户', () => {
    let userToDeleteId: string;

    beforeAll(async () => {
      // 创建一个用于测试删除的用户
      const uniqueId = generateUniqueIdentifier('deleteuser');
      const createResponse = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: uniqueId,
          password: 'DeleteUser@123',
          nickname: '待删除用户',
          phone: `139${Date.now() % 100000000}`.padStart(11, '0'),
          email: `${uniqueId}@example.com`,
        });
      userToDeleteId = createResponse.body.data.id;
    });

    describe('USER-05-01: 删除用户成功', () => {
      it('应该删除用户成功', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/api/users/${userToDeleteId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(204);
      });
    });

    describe('USER-05-02: 删除不存在的用户返回 404', () => {
      it('应该返回用户不存在', async () => {
        const response = await request(app.getHttpServer())
          .delete('/api/users/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.code).toBe(10004);
      });
    });

    describe('USER-05-03: 无权限删除返回 403', () => {
      it('应该返回无权限访问', async () => {
        const testLoginResponse = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            username: 'test',
            password: 'Test@123',
          });

        const testToken = testLoginResponse.body.data.accessToken;

        const response = await request(app.getHttpServer())
          .delete('/api/users/some-test-id')
          .set('Authorization', `Bearer ${testToken}`)
          .expect(403);

        expect(response.body.code).toBe(10003);
      });
    });
  });

  // ============================================================================
  // USER-06: 更新用户状态
  // ============================================================================
  describe('USER-06: 更新用户状态', () => {
    let userForStatusId: string;

    beforeAll(async () => {
      // 创建一个用于测试状态的用户
      const uniqueId = generateUniqueIdentifier('statususer');
      const createResponse = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: uniqueId,
          password: 'StatusUser@123',
          nickname: '状态测试用户',
          phone: `139${Date.now() % 100000000}`.padStart(11, '0'),
          email: `${uniqueId}@example.com`,
        });
      userForStatusId = createResponse.body.data.id;
    });

    describe('USER-06-01: 禁用用户成功', () => {
      it('应该禁用用户成功', async () => {
        const response = await request(app.getHttpServer())
          .put(`/api/users/${userForStatusId}/status?status=0`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data.userStatus).toBe(0);
      });
    });

    describe('USER-06-02: 启用用户成功', () => {
      it('应该启用用户成功', async () => {
        const response = await request(app.getHttpServer())
          .put(`/api/users/${userForStatusId}/status?status=1`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data.userStatus).toBe(1);
      });
    });

    describe('USER-06-03: 无效状态值返回 400', () => {
      it('应该返回参数错误', async () => {
        const response = await request(app.getHttpServer())
          .put(`/api/users/${userForStatusId}/status?status=99`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.code).toBe(10001);
      });
    });
  });

  // ============================================================================
  // USER-07: 重置用户密码
  // ============================================================================
  describe('USER-07: 重置用户密码', () => {
    let userForResetId: string;

    beforeAll(async () => {
      // 创建一个用于测试密码重置的用户
      const uniqueId = generateUniqueIdentifier('resetuser');
      const createResponse = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: uniqueId,
          password: 'ResetUser@123',
          nickname: '密码重置测试用户',
          phone: `139${Date.now() % 100000000}`.padStart(11, '0'),
          email: `${uniqueId}@example.com`,
        });
      userForResetId = createResponse.body.data.id;
    });

    describe('USER-07-01: 重置密码成功', () => {
      it('应该重置密码成功', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/users/${userForResetId}/reset-password?password=NewPassword@456`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.message).toBe('重置成功');
      });
    });

    describe('USER-07-02: 新密码格式不符返回 400', () => {
      it('应该返回密码格式错误', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/users/${userForResetId}/reset-password?password=123456`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.code).toBe(10001);
        expect(response.body.details).toBeDefined();
      });
    });
  });
});

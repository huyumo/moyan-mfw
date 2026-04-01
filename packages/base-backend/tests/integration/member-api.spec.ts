/**
 * @fileoverview 成员管理模块集成测试
 * @description 测试 /api/apps/:appId/members 相关接口的完整功能
 *
 * 测试用例覆盖:
 * - MEMBER-01: 添加成员 (3 个子场景)
 * - MEMBER-02: 获取成员列表 (2 个子场景)
 * - MEMBER-03: 更新成员角色 (3 个子场景)
 * - MEMBER-04: 移除成员 (2 个子场景)
 * - MEMBER-05: 查询可用角色 (1 个子场景)
 */

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  generateUniqueIdentifier,
} from '../setup';

describe('成员管理模块集成测试 (Member API Integration Tests)', () => {
  let app: INestApplication;
  let adminToken: string;
  let testAppId: string;
  let testAppTypeId: string;
  let testUserId: string;
  let newUserId: string;
  let testRoleId: string;

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

    // 使用种子数据中的 ID（有效的 UUID 格式）
    testAppTypeId = 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e';
    testUserId = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';
    testRoleId = 'c3d4e5f6-a7b8-4c5d-8e9f-0a1b2c3d4e5f'; // 管理员角色 (有效的 UUID v4)
    newUserId = 'f6ab2e33-9e8f-4f52-b8f3-95975f727612'; // 第二个测试用户 (testuser)

    // 创建一个测试应用用于成员管理测试
    const uniqueId = generateUniqueIdentifier('memberapp');
    const appResponse = await request(app.getHttpServer())
      .post('/api/apps')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        appTypeId: testAppTypeId,
        appName: `成员测试应用-${uniqueId}`,
        appCode: uniqueId,
        ownerId: testUserId,
      });

    testAppId = appResponse.body.data.id;
  });

  // 测试完成后关闭应用
  afterAll(async () => {
    await app?.close();
  });

  // ============================================================================
  // MEMBER-01: 添加成员测试
  // ============================================================================
  describe('MEMBER-01: 添加成员', () => {
    describe('MEMBER-01-01: 添加成员成功', () => {
      it('应该添加成员成功', async () => {
        console.log('Adding member with:', { appId: testAppId, userId: newUserId });
        const response = await request(app.getHttpServer())
          .post(`/api/apps/${testAppId}/members`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            userId: newUserId,
          });
        console.log('MEMBER-01-01 Response:', response.status, JSON.stringify(response.body));
        expect(response.status).toBe(201);

        expect(response.body.code).toBe(0);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.appId).toBe(testAppId);
        expect(response.body.data.userId).toBe(newUserId);
      });
    });

    describe('MEMBER-01-02: 成员已存在返回 409', () => {
      it('应该返回成员已存在错误', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/apps/${testAppId}/members`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            userId: newUserId, // 重复添加
          })
          .expect(409);

        expect(response.body.code).toBe(10002);
      });
    });

    describe('MEMBER-01-03: 应用不存在返回 404', () => {
      it('应该返回应用不存在错误', async () => {
        const fakeAppId = '00000000-0000-0000-0000-000000000000';
        const response = await request(app.getHttpServer())
          .post(`/api/apps/${fakeAppId}/members`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            userId: newUserId,
          })
          .expect(404);

        expect(response.body.code).toBe(10004);
      });
    });
  });

  // ============================================================================
  // MEMBER-02: 获取成员列表测试
  // ============================================================================
  describe('MEMBER-02: 获取成员列表', () => {
    describe('MEMBER-02-01: 获取应用成员列表成功', () => {
      it('应该获取应用成员列表成功', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/apps/${testAppId}/members`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data).toBeDefined();
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('MEMBER-02-02: 应用不存在返回 404', () => {
      it('应该返回应用不存在错误', async () => {
        const fakeAppId = '00000000-0000-0000-0000-000000000000';
        const response = await request(app.getHttpServer())
          .get(`/api/apps/${fakeAppId}/members`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.code).toBe(10004);
      });
    });
  });

  // ============================================================================
  // MEMBER-03: 更新成员角色测试
  // ============================================================================
  describe('MEMBER-03: 更新成员角色', () => {
    describe('MEMBER-03-01: 更新成员角色成功', () => {
      it('应该更新成员角色成功', async () => {
        const response = await request(app.getHttpServer())
          .put(`/api/apps/${testAppId}/members/${newUserId}/roles`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            roleIds: testRoleId ? [testRoleId] : [],
          })
          .expect(200);

        expect(response.body.code).toBe(0);
      });
    });

    describe('MEMBER-03-02: 成员不存在返回 404', () => {
      it('应该返回成员不存在错误', async () => {
        const fakeUserId = '00000000-0000-0000-0000-000000000000';
        const response = await request(app.getHttpServer())
          .put(`/api/apps/${testAppId}/members/${fakeUserId}/roles`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            roleIds: [],
          })
          .expect(404);

        expect(response.body.code).toBe(10004);
      });
    });

    describe('MEMBER-03-03: 角色不存在返回 400', () => {
      it('应该返回角色不存在错误', async () => {
        const fakeRoleId = '00000000-0000-0000-0000-000000000000';
        const response = await request(app.getHttpServer())
          .put(`/api/apps/${testAppId}/members/${newUserId}/roles`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            roleIds: [fakeRoleId],
          })
          .expect(400);

        expect(response.body.code).toBe(10001);
      });
    });
  });

  // ============================================================================
  // MEMBER-04: 移除成员测试
  // ============================================================================
  describe('MEMBER-04: 移除成员', () => {
    describe('MEMBER-04-01: 移除成员成功', () => {
      it('应该移除成员成功', async () => {
        // 先添加一个新成员用于测试移除
        const uniqueId = generateUniqueIdentifier('tempuser');
        const tempUserResponse = await request(app.getHttpServer())
          .get('/api/users?username=admin&page=1&pageSize=10')
          .set('Authorization', `Bearer ${adminToken}`);

        // 使用已有的用户
        const tempUserId = tempUserResponse.body.data.list[0]?.id || newUserId;

        // 如果用户还不是成员，先添加
        const membersResponse = await request(app.getHttpServer())
          .get(`/api/apps/${testAppId}/members`)
          .set('Authorization', `Bearer ${adminToken}`);

        const isMember = membersResponse.body.data.some((m) => m.userId === tempUserId);

        if (!isMember) {
          await request(app.getHttpServer())
            .post(`/api/apps/${testAppId}/members`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ userId: tempUserId });
        }

        // 移除成员（注意：不能移除拥有者）
        if (tempUserId !== testUserId) {
          const response = await request(app.getHttpServer())
            .delete(`/api/apps/${testAppId}/members/${tempUserId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(204);

          expect(response.body).toBeDefined();
        }
      });
    });

    describe('MEMBER-04-02: 成员不存在返回 404', () => {
      it('应该返回成员不存在错误', async () => {
        const fakeUserId = '00000000-0000-0000-0000-000000000000';
        const response = await request(app.getHttpServer())
          .delete(`/api/apps/${testAppId}/members/${fakeUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.code).toBe(10004);
      });
    });
  });

  // ============================================================================
  // MEMBER-05: 查询可用角色测试
  // ============================================================================
  describe('MEMBER-05: 查询可用角色', () => {
    describe('MEMBER-05-01: 查询可用角色成功', () => {
      it('应该查询可用角色成功', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/apps/${testAppId}/members/available-roles`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data).toBeDefined();
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });
  });
});

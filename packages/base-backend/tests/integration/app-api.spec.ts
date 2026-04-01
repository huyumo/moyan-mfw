/**
 * @fileoverview 应用实例模块集成测试
 * @description 测试 /api/apps 相关接口的完整功能
 *
 * 测试用例覆盖:
 * - APP-01: 创建应用实例 (3 个子场景)
 * - APP-02: 查询应用实例列表 (3 个子场景)
 * - APP-03: 查询应用实例详情 (2 个子场景)
 * - APP-04: 更新应用实例 (3 个子场景)
 * - APP-05: 变更负责人 (2 个子场景)
 */

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  generateUniqueIdentifier,
} from '../setup';

describe('应用实例模块集成测试 (App API Integration Tests)', () => {
  let app: INestApplication;
  let adminToken: string;
  let createdAppId: string;
  let testAppTypeId: string;
  let testUserId: string;

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
  });

  // 测试完成后关闭应用
  afterAll(async () => {
    await app?.close();
  });

  // ============================================================================
  // APP-01: 创建应用实例测试
  // ============================================================================
  describe('APP-01: 创建应用实例', () => {
    describe('APP-01-01: 创建应用实例成功', () => {
      it('应该创建应用实例成功', async () => {
        const uniqueId = generateUniqueIdentifier('testapp');
        const response = await request(app.getHttpServer())
          .post('/api/apps')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            appTypeId: testAppTypeId,
            appName: `测试应用-${uniqueId}`,
            appCode: uniqueId,
            ownerId: testUserId,
            appDesc: '测试应用实例',
            icon: 'test-icon.png',
            sortOrder: 0,
          })
          .expect(201);

        expect(response.body.code).toBe(0);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.id).toBeDefined();
        expect(response.body.data.appName).toContain('测试应用');

        createdAppId = response.body.data.id;
      });
    });

    describe('APP-01-02: 应用编码已存在返回 409', () => {
      it('应该返回应用编码已存在错误', async () => {
        const uniqueId = generateUniqueIdentifier('dupapp');

        // 先创建一个应用
        await request(app.getHttpServer())
          .post('/api/apps')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            appTypeId: testAppTypeId,
            appName: `测试应用-${uniqueId}`,
            appCode: uniqueId,
            ownerId: testUserId,
          });

        // 尝试创建编码重复的应用
        const response = await request(app.getHttpServer())
          .post('/api/apps')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            appTypeId: testAppTypeId,
            appName: `重复应用-${uniqueId}`,
            appCode: uniqueId, // 重复的编码
            ownerId: testUserId,
          })
          .expect(409);

        expect(response.body.code).toBe(10002);
      });
    });

    describe('APP-01-03: 缺少必填字段返回 400', () => {
      it('应该返回参数验证错误', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/apps')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            // 缺少必填字段 appTypeId, appName, appCode, ownerId
            appDesc: '不完整的应用',
          })
          .expect(400);

        expect(response.body).toBeDefined();
      });
    });
  });

  // ============================================================================
  // APP-02: 查询应用实例列表测试
  // ============================================================================
  describe('APP-02: 查询应用实例列表', () => {
    describe('APP-02-01: 分页查询应用实例列表成功', () => {
      it('应该分页查询应用实例列表成功', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/apps?page=1&pageSize=10')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.list).toBeDefined();
        expect(response.body.data.total).toBeDefined();
        expect(response.body.data.page).toBe(1);
        expect(response.body.data.pageSize).toBe(10);
      });
    });

    describe('APP-02-02: 按条件筛选成功', () => {
      it('应该按应用名称筛选成功', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/apps?appName=测试应用&page=1&pageSize=10')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data.list).toBeDefined();
      });

      it('应该按应用状态筛选成功', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/apps?appStatus=1&page=1&pageSize=10')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data.list).toBeDefined();
      });
    });

    describe('APP-02-03: 未授权访问返回 401', () => {
      it('应该返回未授权错误', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/apps?page=1&pageSize=10')
          .expect(401);

        expect(response.body).toBeDefined();
      });
    });
  });

  // ============================================================================
  // APP-03: 查询应用实例详情测试
  // ============================================================================
  describe('APP-03: 查询应用实例详情', () => {
    describe('APP-03-01: 查询应用实例详情成功', () => {
      it('应该查询应用实例详情成功', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/apps/${createdAppId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.id).toBe(createdAppId);
      });
    });

    describe('APP-03-02: 应用实例不存在返回 404', () => {
      it('应该返回应用不存在错误', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const response = await request(app.getHttpServer())
          .get(`/api/apps/${fakeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.code).toBe(10004);
      });
    });
  });

  // ============================================================================
  // APP-04: 更新应用实例测试
  // ============================================================================
  describe('APP-04: 更新应用实例', () => {
    describe('APP-04-01: 更新应用实例成功', () => {
      it('应该更新应用实例成功', async () => {
        const response = await request(app.getHttpServer())
          .put(`/api/apps/${createdAppId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            appName: `更新后的测试应用`,
            appDesc: '更新后的描述',
          })
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data.appName).toBe('更新后的测试应用');
      });
    });

    describe('APP-04-02: 应用编码冲突返回 409', () => {
      it('应该返回编码冲突错误', async () => {
        const uniqueId = generateUniqueIdentifier('anotherapp');

        // 先创建另一个应用
        await request(app.getHttpServer())
          .post('/api/apps')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            appTypeId: testAppTypeId,
            appName: `另一个应用-${uniqueId}`,
            appCode: uniqueId,
            ownerId: testUserId,
          });

        // 尝试更新当前应用到重复的编码
        const response = await request(app.getHttpServer())
          .put(`/api/apps/${createdAppId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            appCode: uniqueId, // 重复的编码
          })
          .expect(409);

        expect(response.body.code).toBe(10002);
      });
    });

    describe('APP-04-03: 更新不存在的应用返回 404', () => {
      it('应该返回应用不存在错误', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const response = await request(app.getHttpServer())
          .put(`/api/apps/${fakeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            appName: '更新失败的应用',
          })
          .expect(404);

        expect(response.body.code).toBe(10004);
      });
    });
  });

  // ============================================================================
  // APP-05: 变更负责人测试
  // ============================================================================
  describe('APP-05: 变更负责人', () => {
    describe('APP-05-01: 变更负责人成功', () => {
      it('应该变更负责人成功', async () => {
        // 获取另一个用户 ID
        const userListResponse = await request(app.getHttpServer())
          .get('/api/users?page=1&pageSize=10')
          .set('Authorization', `Bearer ${adminToken}`);

        const users = userListResponse.body.data.list;
        const newOwnerId = users.length > 1 ? users[1].id : testUserId;

        const response = await request(app.getHttpServer())
          .put(`/api/apps/${createdAppId}/owner?ownerId=${newOwnerId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
      });
    });

    describe('APP-05-02: 变更不存在的应用返回 404', () => {
      it('应该返回应用不存在错误', async () => {
        const fakeId = '00000000-0000-0000-0000-000000000000';
        const response = await request(app.getHttpServer())
          .put(`/api/apps/${fakeId}/owner?ownerId=${testUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.code).toBe(10004);
      });
    });
  });
});

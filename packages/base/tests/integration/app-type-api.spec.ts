/**
 * @fileoverview 应用类型模块集成测试
 * @description 测试 /api/app-types 相关接口的完整功能
 *
 * 测试用例覆盖:
 * - APP-TYPE-01: 创建应用类型 (3 个子场景)
 * - APP-TYPE-02: 查询应用类型列表 (4 个子场景)
 * - APP-TYPE-03: 查询所有应用类型 (2 个子场景)
 * - APP-TYPE-04: 查询应用类型详情 (2 个子场景)
 * - APP-TYPE-05: 更新应用类型 (3 个子场景)
 * - APP-TYPE-06: 删除应用类型 (2 个子场景)
 * - APP-TYPE-07: 应用类型状态管理 (1 个子场景)
 */

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  generateUniqueIdentifier,
} from '../setup';

describe('应用类型模块集成测试 (AppType API Integration Tests)', () => {
  let app: INestApplication;
  let adminToken: string;
  let createdAppTypeId: string;
  let testAppTypeId: string;

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

    // 获取一个已存在的应用类型 ID（用于后续测试）
    const typeListResponse = await request(app.getHttpServer())
      .get('/api/app-types?page=1&pageSize=1')
      .set('Authorization', `Bearer ${adminToken}`);

    if (typeListResponse.body.data.list.length > 0) {
      testAppTypeId = typeListResponse.body.data.list[0].id;
    }
  });

  // 测试完成后关闭应用
  afterAll(async () => {
    await app?.close();
  });

  // ============================================================================
  // APP-TYPE-01: 创建应用类型测试
  // ============================================================================
  describe('APP-TYPE-01: 创建应用类型', () => {
    describe('APP-TYPE-01-01: 创建应用类型成功', () => {
      it('应该创建应用类型成功', async () => {
        const uniqueId = generateUniqueIdentifier('newapptype');
        const response = await request(app.getHttpServer())
          .post('/api/app-types')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            typeName: `新应用类型-${uniqueId}`,
            typeCode: uniqueId,
            typeDesc: '测试应用类型',
            multiAppEnabled: 0,
            typeStatus: 1,
          })
          .expect(201);

        expect(response.body.code).toBe(0);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.id).toBeDefined();
        expect(response.body.data.typeName).toContain('新应用类型');

        createdAppTypeId = response.body.data.id;
      });
    });

    describe('APP-TYPE-01-02: 类型编码已存在创建失败', () => {
      it('应该返回类型编码已存在', async () => {
        // 先获取一个已存在的 typeCode
        const listResponse = await request(app.getHttpServer())
          .get('/api/app-types?page=1&pageSize=1')
          .set('Authorization', `Bearer ${adminToken}`);

        const existingCode = listResponse.body.data.list[0].typeCode;

        const response = await request(app.getHttpServer())
          .post('/api/app-types')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            typeName: '重复类型',
            typeCode: existingCode,
            typeDesc: '重复类型',
          })
          .expect(409);

        expect(response.body.code).toBe(10002);
        expect(response.body.message).toContain('已存在');
      });
    });

    describe('APP-TYPE-01-03: 缺少必填字段创建失败', () => {
      it('应该返回参数错误', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/app-types')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            // 缺少 typeName 和 typeCode
            description: '不完整类型',
          })
          .expect(400);

        expect(response.body.code).toBe(10001);
      });
    });
  });

  // ============================================================================
  // APP-TYPE-02: 查询应用类型列表
  // ============================================================================
  describe('APP-TYPE-02: 查询应用类型列表', () => {
    describe('APP-TYPE-02-01: 分页查询应用类型列表成功', () => {
      it('应该返回分页应用类型列表', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/app-types?page=1&pageSize=10')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.list).toBeDefined();
        expect(Array.isArray(response.body.data.list)).toBe(true);
        expect(response.body.data.total).toBeGreaterThanOrEqual(1);
        expect(response.body.data.page).toBe(1);
        expect(response.body.data.pageSize).toBe(10);
      });
    });

    describe('APP-TYPE-02-02: 按条件筛选应用类型', () => {
      it('应该返回匹配的应用类型', async () => {
        const listResponse = await request(app.getHttpServer())
          .get('/api/app-types?page=1&pageSize=1')
          .set('Authorization', `Bearer ${adminToken}`);

        const typeCode = listResponse.body.data.list[0].typeCode;

        const response = await request(app.getHttpServer())
          .get(`/api/app-types?typeCode=${typeCode}&page=1&pageSize=10`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data.total).toBeGreaterThanOrEqual(1);
      });
    });

    describe('APP-TYPE-02-03: 按状态筛选应用类型', () => {
      it('应该返回指定状态的应用类型', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/app-types?typeStatus=1&page=1&pageSize=10')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data.list.every((t: any) => t.typeStatus === 1)).toBe(true);
      });
    });

    describe('APP-TYPE-02-04: 未授权访问返回 401', () => {
      it('应该返回未授权访问', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/app-types?page=1&pageSize=10')
          .expect(401);

        expect(response.body.code).toBe(401);
      });
    });
  });

  // ============================================================================
  // APP-TYPE-03: 查询所有应用类型
  // ============================================================================
  describe('APP-TYPE-03: 查询所有应用类型', () => {
    describe('APP-TYPE-03-01: 查询所有应用类型成功', () => {
      it('应该返回所有应用类型', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/app-types/all')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data).toBeDefined();
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('APP-TYPE-03-02: 未授权访问返回 401', () => {
      it('应该返回未授权访问', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/app-types/all')
          .expect(401);

        expect(response.body.code).toBe(401);
      });
    });
  });

  // ============================================================================
  // APP-TYPE-04: 查询应用类型详情
  // ============================================================================
  describe('APP-TYPE-04: 查询应用类型详情', () => {
    describe('APP-TYPE-04-01: 查询应用类型详情成功', () => {
      it('应该返回应用类型详情', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/app-types/${testAppTypeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data.id).toBe(testAppTypeId);
      });
    });

    describe('APP-TYPE-04-02: 应用类型不存在返回 404', () => {
      it('应该返回应用类型不存在', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/app-types/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.code).toBe(10004);
      });
    });
  });

  // ============================================================================
  // APP-TYPE-05: 更新应用类型
  // ============================================================================
  describe('APP-TYPE-05: 更新应用类型', () => {
    describe('APP-TYPE-05-01: 更新应用类型成功', () => {
      it('应该更新应用类型成功', async () => {
        const response = await request(app.getHttpServer())
          .put(`/api/app-types/${testAppTypeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            typeName: '更新后的应用类型',
            typeDesc: '更新后的描述',
          })
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data.typeName).toBe('更新后的应用类型');
      });
    });

    describe('APP-TYPE-05-02: 更新不存在的应用类型返回 404', () => {
      it('应该返回应用类型不存在', async () => {
        const response = await request(app.getHttpServer())
          .put('/api/app-types/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            typeName: '新类型名',
          })
          .expect(404);

        expect(response.body.code).toBe(10004);
      });
    });

    describe('APP-TYPE-05-03: 类型编码冲突返回 409', () => {
      it('应该返回类型编码已存在', async () => {
        // 获取所有应用类型，找到一个与 testAppTypeId 不同的 typeCode
        const listResponse = await request(app.getHttpServer())
          .get('/api/app-types?page=1&pageSize=10')
          .set('Authorization', `Bearer ${adminToken}`);

        const targetType = listResponse.body.data.list.find(
          (t: any) => t.id !== testAppTypeId
        );

        if (targetType && targetType.typeCode) {
          const response = await request(app.getHttpServer())
            .put(`/api/app-types/${testAppTypeId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              typeCode: targetType.typeCode,
            })
            .expect(409);

          expect(response.body.code).toBe(10002);
        } else {
          // 如果找不到不同的类型，跳过测试
          return;
        }
      });
    });
  });

  // ============================================================================
  // APP-TYPE-06: 删除应用类型
  // ============================================================================
  describe('APP-TYPE-06: 删除应用类型', () => {
    let appTypeToDeleteId: string;

    beforeAll(async () => {
      // 创建一个用于测试删除的应用类型
      const uniqueId = generateUniqueIdentifier('deleteapptype');
      const createResponse = await request(app.getHttpServer())
        .post('/api/app-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          typeName: `待删除类型-${uniqueId}`,
          typeCode: uniqueId,
          typeDesc: '待删除类型',
          multiAppEnabled: 0,
        });
      if (createResponse.body.code === 0) {
        appTypeToDeleteId = createResponse.body.data.id;
      }
    });

    describe('APP-TYPE-06-01: 删除应用类型成功', () => {
      it('应该删除应用类型成功', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/api/app-types/${appTypeToDeleteId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(204);
      });
    });

    describe('APP-TYPE-06-02: 删除不存在的应用类型返回 404', () => {
      it('应该返回应用类型不存在', async () => {
        const response = await request(app.getHttpServer())
          .delete('/api/app-types/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.code).toBe(10004);
      });
    });
  });

  // ============================================================================
  // APP-TYPE-07: 应用类型状态管理
  // ============================================================================
  describe('APP-TYPE-07: 应用类型状态管理', () => {
    describe('APP-TYPE-07-01: 禁用应用类型成功', () => {
      it('应该禁用应用类型成功', async () => {
        const response = await request(app.getHttpServer())
          .put(`/api/app-types/${testAppTypeId}/status?status=0`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data.typeStatus).toBe(0);
      });
    });
  });
});

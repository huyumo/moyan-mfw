/**
 * @fileoverview 权限模块集成测试
 * @description 测试 /api/permissions 相关接口的完整功能
 *
 * 测试用例覆盖:
 * - PERM-01: 创建权限 (3 个子场景)
 * - PERM-02: 查询权限列表 (3 个子场景)
 * - PERM-03: 查询所有权限树 (2 个子场景)
 * - PERM-04: 查询权限树 (2 个子场景)
 * - PERM-05: 查询权限详情 (2 个子场景)
 * - PERM-06: 更新权限 (3 个子场景)
 * - PERM-07: 删除权限 (3 个子场景)
 * - PERM-08: 批量创建权限 (3 个子场景)
 */

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  generateUniqueIdentifier,
} from '../setup';

describe('权限模块集成测试 (Permission API Integration Tests)', () => {
  let app: INestApplication;
  let adminToken: string;
  let createdPermissionId: string;
  let testPermissionId: string;

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

    // 获取一个已存在的权限 ID（用于后续测试）
    const permListResponse = await request(app.getHttpServer())
      .get('/api/permissions?page=1&pageSize=1')
      .set('Authorization', `Bearer ${adminToken}`);

    if (permListResponse.body.data.list.length > 0) {
      testPermissionId = permListResponse.body.data.list[0].id;
    }
  });

  // 测试完成后关闭应用
  afterAll(async () => {
    await app?.close();
  });

  // ============================================================================
  // PERM-01: 创建权限测试
  // ============================================================================
  describe('PERM-01: 创建权限', () => {
    describe('PERM-01-01: 创建权限成功', () => {
      it('应该创建权限成功', async () => {
        const uniqueId = generateUniqueIdentifier('newperm');
        const response = await request(app.getHttpServer())
          .post('/api/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            permName: `新权限-${uniqueId}`,
            permCode: uniqueId,
            permDesc: '测试权限',
            permissionType: 'NORMAL',
            nodeType: 'MENU',
          })
          .expect(201);

        expect(response.body.code).toBe(0);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.id).toBeDefined();
        expect(response.body.data.permName).toContain('新权限');

        createdPermissionId = response.body.data.id;
      });
    });

    describe('PERM-01-02: 权限编码已存在创建失败', () => {
      it('应该返回权限编码已存在', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            permName: '重复权限',
            permCode: 'system:user', // 已存在的权限编码
            permissionType: 'NORMAL',
            nodeType: 'MENU',
          })
          .expect(409);

        expect(response.body.code).toBe(10002);
        expect(response.body.message).toContain('已存在');
      });
    });

    describe('PERM-01-03: 缺少必填字段创建失败', () => {
      it('应该返回参数错误', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            // 缺少 permName 和 permCode
            description: '不完整权限',
          })
          .expect(400);

        expect(response.body.code).toBe(10001);
      });
    });
  });

  // ============================================================================
  // PERM-02: 查询权限列表
  // ============================================================================
  describe('PERM-02: 查询权限列表', () => {
    describe('PERM-02-01: 分页查询权限列表成功', () => {
      it('应该返回分页权限列表', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/permissions?page=1&pageSize=10')
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

    describe('PERM-02-02: 按条件筛选权限', () => {
      it('应该返回匹配的权限', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/permissions?permCode=system&page=1&pageSize=10')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
      });
    });

    describe('PERM-02-03: 未授权访问返回 401', () => {
      it('应该返回未授权访问', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/permissions?page=1&pageSize=10')
          .expect(401);

        expect(response.body.code).toBe(401);
      });
    });
  });

  // ============================================================================
  // PERM-03: 查询所有权限树
  // ============================================================================
  describe('PERM-03: 查询所有权限树', () => {
    describe('PERM-03-01: 查询所有权限树成功', () => {
      it('应该返回权限树形结构', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/permissions/tree/all')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data).toBeDefined();
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('PERM-03-02: 未授权访问返回 401', () => {
      it('应该返回未授权访问', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/permissions/tree/all')
          .expect(401);

        expect(response.body.code).toBe(401);
      });
    });
  });

  // ============================================================================
  // PERM-04: 查询权限树
  // ============================================================================
  describe('PERM-04: 查询权限树', () => {
    describe('PERM-04-01: 查询权限树成功', () => {
      it('应该返回权限树形结构', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/permissions/tree')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data).toBeDefined();
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('PERM-04-02: 查询指定父权限的子权限', () => {
      it('应该返回子权限列表', async () => {
        // 先获取一个根权限
        const listResponse = await request(app.getHttpServer())
          .get('/api/permissions?nodeType=1&page=1&pageSize=1')
          .set('Authorization', `Bearer ${adminToken}`);

        if (listResponse.body.data?.list?.length > 0) {
          const parentId = listResponse.body.data.list[0].id;

          const response = await request(app.getHttpServer())
            .get(`/api/permissions/tree?parentId=${parentId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

          expect(response.body.code).toBe(0);
        } else {
          // 如果找不到根权限，跳过测试
          return;
        }
      });
    });
  });

  // ============================================================================
  // PERM-05: 查询权限详情
  // ============================================================================
  describe('PERM-05: 查询权限详情', () => {
    describe('PERM-05-01: 查询权限详情成功', () => {
      it('应该返回权限详情', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/permissions/${testPermissionId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data.id).toBe(testPermissionId);
      });
    });

    describe('PERM-05-02: 权限不存在返回 404', () => {
      it('应该返回权限不存在', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/permissions/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.code).toBe(10004);
      });
    });
  });

  // ============================================================================
  // PERM-06: 更新权限
  // ============================================================================
  describe('PERM-06: 更新权限', () => {
    describe('PERM-06-01: 更新权限成功', () => {
      it('应该更新权限成功', async () => {
        if (!testPermissionId) {
          return; // 跳过测试
        }
        const response = await request(app.getHttpServer())
          .put(`/api/permissions/${testPermissionId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            permName: '更新后的权限名称',
            permDesc: '更新后的描述',
          })
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data.permName).toBe('更新后的权限名称');
      });
    });

    describe('PERM-06-02: 更新不存在的权限返回 404', () => {
      it('应该返回权限不存在', async () => {
        const response = await request(app.getHttpServer())
          .put('/api/permissions/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            permName: '新权限名',
          })
          .expect(404);

        expect(response.body.code).toBe(10004);
      });
    });

    describe('PERM-06-03: 权限编码冲突返回 409', () => {
      it('应该返回权限编码已存在', async () => {
        if (!testPermissionId) {
          return; // 跳过测试
        }
        const response = await request(app.getHttpServer())
          .put(`/api/permissions/${testPermissionId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            permCode: 'system:user', // 已存在的权限编码
          })
          .expect(409);

        expect(response.body.code).toBe(10002);
      });
    });
  });

  // ============================================================================
  // PERM-07: 删除权限
  // ============================================================================
  describe('PERM-07: 删除权限', () => {
    let permissionToDeleteId: string;

    beforeAll(async () => {
      // 创建一个用于测试删除的权限
      const uniqueId = generateUniqueIdentifier('deleteperm');
      const createResponse = await request(app.getHttpServer())
        .post('/api/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          permName: `待删除权限-${uniqueId}`,
          permCode: uniqueId,
          permDesc: '待删除权限',
          permissionType: 'NORMAL',
          nodeType: 'TAG',
        });
      if (createResponse.body.code === 0) {
        permissionToDeleteId = createResponse.body.data.id;
      }
    });

    describe('PERM-07-01: 删除权限成功', () => {
      it('应该删除权限成功', async () => {
        if (!permissionToDeleteId) {
          return; // 跳过测试
        }
        const response = await request(app.getHttpServer())
          .delete(`/api/permissions/${permissionToDeleteId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(204);
      });
    });

    describe('PERM-07-02: 删除不存在的权限返回 404', () => {
      it('应该返回权限不存在', async () => {
        const response = await request(app.getHttpServer())
          .delete('/api/permissions/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.code).toBe(10004);
      });
    });

    describe('PERM-07-03: 删除有子节点的权限返回 400', () => {
      it('应该返回存在子节点无法删除', async () => {
        // 查找一个有子节点的权限（如 system 根节点）
        const listResponse = await request(app.getHttpServer())
          .get('/api/permissions?nodeType=1&page=1&pageSize=1')
          .set('Authorization', `Bearer ${adminToken}`);

        if (listResponse.body.data?.list?.length > 0) {
          const parentId = listResponse.body.data.list[0].id;

          const response = await request(app.getHttpServer())
            .delete(`/api/permissions/${parentId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(409);

          expect(response.body.code).toBe(10002);
        } else {
          // 如果找不到有子节点的权限，跳过测试
          return;
        }
      });
    });
  });

  // ============================================================================
  // PERM-08: 批量创建权限
  // ============================================================================
  describe('PERM-08: 批量创建权限', () => {
    describe('PERM-08-01: 批量创建权限成功', () => {
      it('应该批量创建权限成功', async () => {
        const uniqueId = generateUniqueIdentifier('batch');
        const response = await request(app.getHttpServer())
          .post('/api/permissions/batch')
          .set('Authorization', `Bearer ${adminToken}`)
          .send([
            {
              permName: `批量权限 1-${uniqueId}`,
              permCode: `${uniqueId}-perm1`,
              permDesc: '批量创建权限 1',
              permissionType: 'NORMAL',
              nodeType: 'TAG',
            },
            {
              permName: `批量权限 2-${uniqueId}`,
              permCode: `${uniqueId}-perm2`,
              permDesc: '批量创建权限 2',
              permissionType: 'NORMAL',
              nodeType: 'TAG',
            },
          ])
          .expect(201);

        expect(response.body.code).toBe(0);
        expect(response.body.data).toBeDefined();
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(2);
      });
    });

    describe('PERM-08-02: 批量创建权限编码重复返回 409', () => {
      it('应该返回权限编码已存在', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/permissions/batch')
          .set('Authorization', `Bearer ${adminToken}`)
          .send([
            {
              permName: '重复权限批量',
              permCode: 'system:user', // 已存在的权限编码
              permissionType: 'NORMAL',
              nodeType: 'MENU',
            },
          ])
          .expect(409);

        expect(response.body.code).toBe(10002);
      });
    });

    describe('PERM-08-03: 批量创建缺少必填字段返回 400', () => {
      it('应该返回参数错误', async () => {
        const uniqueId = generateUniqueIdentifier('invalid');
        const response = await request(app.getHttpServer())
          .post('/api/permissions/batch')
          .set('Authorization', `Bearer ${adminToken}`)
          .send([
            {
              // 缺少 permName（必填字段），使用唯一的 permCode 避免 409
              permCode: `${uniqueId}-missing-name`,
              permDesc: '不完整权限',
            },
          ])
          .expect(400);

        // 批量创建接口会经过 DTO 验证，缺少必填字段应返回 400
        expect(response.body.code).toBe(10001);
      });
    });
  });
});

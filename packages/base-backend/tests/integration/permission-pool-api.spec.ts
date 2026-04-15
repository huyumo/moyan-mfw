/**
 * @fileoverview 权限池接口统一优化验证测试
 * @description 验证权限池和角色权限接口的 checked 和 parentPermissionValue 字段
 *
 * 测试用例覆盖:
 * - POOL-01: 获取权限池配置 - 验证 checked 字段
 * - POOL-02: 获取角色权限树 - 验证 checked 字段
 * - POOL-03: 验证 parentPermissionValue 字段
 */

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp, login, generateUniqueIdentifier } from '../setup';

describe('权限池接口统一优化验证测试', () => {
  let app: INestApplication;
  let adminToken: string;
  let testAppTypeId: string;
  let testRoleId: string;
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

    // 获取一个应用类型 ID
    const appTypeResponse = await request(app.getHttpServer())
      .get('/api/app-types?page=1&pageSize=1')
      .set('Authorization', `Bearer ${adminToken}`);

    if (appTypeResponse.body.data.list.length > 0) {
      testAppTypeId = appTypeResponse.body.data.list[0].id;
    }

    // 获取一个角色 ID
    const roleResponse = await request(app.getHttpServer())
      .get('/api/roles?page=1&pageSize=1')
      .set('Authorization', `Bearer ${adminToken}`);

    if (roleResponse.body.data.list.length > 0) {
      testRoleId = roleResponse.body.data.list[0].id;
    }

    // 获取一个权限 ID
    const permissionResponse = await request(app.getHttpServer())
      .get('/api/permissions?page=1&pageSize=1')
      .set('Authorization', `Bearer ${adminToken}`);

    if (permissionResponse.body.data.list.length > 0) {
      testPermissionId = permissionResponse.body.data.list[0].id;
    }
  });

  // 测试完成后关闭应用
  afterAll(async () => {
    await app?.close();
  });

  // ============================================================================
  // POOL-01: 获取权限池配置 - 验证 checked 字段
  // ============================================================================
  describe('POOL-01: 获取权限池配置 - 验证 checked 字段', () => {
    describe('POOL-01-01: 权限池配置返回 checked 字段', () => {
      it('应该返回包含 checked 字段的权限池配置', async () => {
        if (!testAppTypeId) {
          return; // 跳过测试
        }

        const response = await request(app.getHttpServer())
          .get(`/api/app-types/${testAppTypeId}/permission-pool`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.permissionTrees).toBeDefined();

        // 递归查找有 parentId 的节点进行验证
        const findNodeWithParent = (nodes: any[]): any => {
          for (const node of nodes) {
            if (node.parentId !== undefined && node.parentId !== null) {
              return node;
            }
            if (node.children && node.children.length > 0) {
              const found = findNodeWithParent(node.children);
              if (found) return found;
            }
          }
          return null;
        };

        // 验证 pcTree 中的节点
        const pcNodeWithParent = findNodeWithParent(response.body.data.permissionTrees.pcTree);
        if (pcNodeWithParent) {
          expect(pcNodeWithParent).toHaveProperty('checked');
          expect(typeof pcNodeWithParent.checked).toBe('boolean');
          // 验证新增字段
          expect(pcNodeWithParent).toHaveProperty('parentPermissionValue');
        }

        // 验证 normalTree 中的节点
        const normalNodeWithParent = findNodeWithParent(response.body.data.permissionTrees.normalTree);
        if (normalNodeWithParent) {
          expect(normalNodeWithParent).toHaveProperty('checked');
          expect(typeof normalNodeWithParent.checked).toBe('boolean');
          // 验证新增字段
          expect(normalNodeWithParent).toHaveProperty('parentPermissionValue');
        }
      });
    });
  });

  // ============================================================================
  // POOL-02: 获取角色权限树 - 验证 checked 字段
  // ============================================================================
  describe('POOL-02: 获取角色权限树 - 验证 checked 字段', () => {
    describe('POOL-02-01: 角色权限树返回 checked 字段', () => {
      it('应该返回包含 checked 字段的角色权限树', async () => {
        if (!testRoleId) {
          return; // 跳过测试
        }

        const response = await request(app.getHttpServer())
          .get(`/api/roles/${testRoleId}/permissions`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.permissionTrees).toBeDefined();

        // 递归查找有 parentId 的节点进行验证
        const findNodeWithParent = (nodes: any[]): any => {
          for (const node of nodes) {
            if (node.parentId !== undefined && node.parentId !== null) {
              return node;
            }
            if (node.children && node.children.length > 0) {
              const found = findNodeWithParent(node.children);
              if (found) return found;
            }
          }
          return null;
        };

        // 验证 pcTree 中的节点
        const pcNodeWithParent = findNodeWithParent(response.body.data.permissionTrees.pcTree);
        if (pcNodeWithParent) {
          expect(pcNodeWithParent).toHaveProperty('checked');
          expect(typeof pcNodeWithParent.checked).toBe('boolean');
          // 验证新增字段
          expect(pcNodeWithParent).toHaveProperty('parentPermissionValue');
        }

        // 验证 normalTree 中的节点
        const normalNodeWithParent = findNodeWithParent(response.body.data.permissionTrees.normalTree);
        if (normalNodeWithParent) {
          expect(normalNodeWithParent).toHaveProperty('checked');
          expect(typeof normalNodeWithParent.checked).toBe('boolean');
          // 验证新增字段
          expect(normalNodeWithParent).toHaveProperty('parentPermissionValue');
        }
      });
    });
  });

  // ============================================================================
  // POOL-03: 验证 parentPermissionValue 字段
  // ============================================================================
  describe('POOL-03: 验证 parentPermissionValue 字段', () => {
    describe('POOL-03-01: 权限池配置包含 parentPermissionValue', () => {
      it('应该返回包含 parentPermissionValue 字段的权限配置', async () => {
        if (!testAppTypeId) {
          return; // 跳过测试
        }

        const response = await request(app.getHttpServer())
          .get(`/api/app-types/${testAppTypeId}/permission-pool`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // 递归查找有 parentId 的节点
        const findNodeWithParent = (nodes: any[]): any => {
          for (const node of nodes) {
            if (node.parentId !== undefined && node.parentId !== null) {
              return node;
            }
            if (node.children && node.children.length > 0) {
              const found = findNodeWithParent(node.children);
              if (found) return found;
            }
          }
          return null;
        };

        const nodeWithParent = findNodeWithParent(response.body.data.permissionTrees.pcTree);
        if (nodeWithParent) {
          // 有父节点的节点应该有 parentPermissionValue 字段（如果父节点在权限池中）
          expect(nodeWithParent).toHaveProperty('parentPermissionValue');
        }
      });
    });
  });

  // ============================================================================
  // POOL-04: 字段统一性验证
  // ============================================================================
  describe('POOL-04: 字段统一性验证', () => {
    describe('POOL-04-01: 权限池和角色权限使用相同的 checked 字段名', () => {
      it('应该验证两个接口都使用 checked 字段而非 inPool 或 assigned', async () => {
        if (!testAppTypeId || !testRoleId) {
          return; // 跳过测试
        }

        // 获取权限池配置
        const poolResponse = await request(app.getHttpServer())
          .get(`/api/app-types/${testAppTypeId}/permission-pool`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // 获取角色权限树
        const roleResponse = await request(app.getHttpServer())
          .get(`/api/roles/${testRoleId}/permissions`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // 验证都不包含旧字段名
        const poolNodes: any[] = [
          ...poolResponse.body.data.permissionTrees.pcTree,
          ...poolResponse.body.data.permissionTrees.normalTree,
        ];

        const roleNodes: any[] = [
          ...roleResponse.body.data.permissionTrees.pcTree,
          ...roleResponse.body.data.permissionTrees.normalTree,
        ];

        // 验证权限池节点不包含 inPool 字段
        for (const node of poolNodes) {
          expect(node).not.toHaveProperty('inPool');
          expect(node).toHaveProperty('checked');
        }

        // 验证角色权限节点不包含 assigned 字段
        for (const node of roleNodes) {
          expect(node).not.toHaveProperty('assigned');
          expect(node).toHaveProperty('checked');
        }
      });
    });
  });
});

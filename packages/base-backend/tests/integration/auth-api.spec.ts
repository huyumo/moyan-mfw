/**
 * @fileoverview 认证模块集成测试
 * @description 测试 /api/auth 相关接口的完整功能
 *
 * 测试用例覆盖:
 * - AUTH-01: 用户登录 (4 个子场景)
 * - AUTH-02: 刷新 Token (3 个子场景)
 * - AUTH-03: 获取当前用户信息 (3 个子场景)
 * - AUTH-04: 退出登录 (2 个子场景)
 */

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
} from '../setup';

describe('认证模块集成测试 (Auth API Integration Tests)', () => {
  let app: INestApplication;
  let adminToken: string;

  // 测试前启动应用
  beforeAll(async () => {
    app = await createTestApp();
  });

  // 每个测试后清理
  afterEach(async () => {
    // 清理测试数据
  });

  // 测试完成后关闭应用
  afterAll(async () => {
    await app?.close();
  });

  // ============================================================================
  // AUTH-01: 用户登录测试
  // ============================================================================
  describe('AUTH-01: 用户登录', () => {
    describe('AUTH-01-01: 使用用户名登录成功', () => {
      it('应该登录成功并返回 Token', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            username: 'admin',
            password: 'Admin@123',
          })
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.accessToken).toBeDefined();
        expect(response.body.data.refreshToken).toBeDefined();
        expect(response.body.data.tokenType).toBe('Bearer');
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.user.username).toBe('admin');

        // 保存 Token 供后续测试使用
        adminToken = response.body.data.accessToken;
      });
    });

    describe('AUTH-01-02: 密码错误登录失败', () => {
      it('应该返回用户名或密码错误', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            username: 'admin',
            password: 'WrongPassword123',
          })
          .expect(401);

        expect(response.body.code).toBe(401);
        expect(response.body.message).toContain('密码');
      });
    });

    describe('AUTH-01-03: 用户不存在登录失败', () => {
      it('应该返回用户名或密码错误', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            username: 'nonexistent_user',
            password: 'AnyPassword123',
          })
          .expect(401);

        expect(response.body.code).toBe(401);
      });
    });

    describe('AUTH-01-04: 参数缺失登录失败', () => {
      it('应该返回参数错误', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            username: 'admin',
            // 缺少 password
          })
          .expect(400);

        expect(response.body.code).toBe(10001);
        expect(response.body.details).toBeDefined();
        expect(Array.isArray(response.body.details)).toBe(true);
        expect(response.body.details.some((d: any) => d.field === 'password')).toBe(true);
      });
    });
  });

  // ============================================================================
  // AUTH-02: 刷新 Token 测试
  // ============================================================================
  describe('AUTH-02: 刷新 Token', () => {
    let validRefreshToken: string;

    beforeAll(async () => {
      // 先登录获取有效的 refresh token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'Admin@123',
        });
      validRefreshToken = loginResponse.body.data.refreshToken;
    });

    describe('AUTH-02-01: 使用有效 refreshToken 刷新成功', () => {
      it('应该刷新成功并返回新的 Token', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/refresh')
          .send({
            refreshToken: validRefreshToken,
          })
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.accessToken).toBeDefined();
        expect(response.body.data.refreshToken).toBeDefined();
        // 新 token 应该与旧 token 不同
        expect(response.body.data.refreshToken).not.toBe(validRefreshToken);
      });
    });

    describe('AUTH-02-02: 使用无效 refreshToken 刷新失败', () => {
      it('应该返回刷新 Token 无效', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/refresh')
          .send({
            refreshToken: 'invalid_token_xyz',
          })
          .expect(401);

        expect(response.body.code).toBe(401);
        expect(response.body.message).toContain('Token');
      });
    });

    describe('AUTH-02-03: refreshToken 缺失返回错误', () => {
      it('应该返回参数错误', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/refresh')
          .send({})
          .expect(400);

        expect(response.body.code).toBe(10001);
      });
    });
  });

  // ============================================================================
  // AUTH-03: 获取当前用户信息测试
  // ============================================================================
  describe('AUTH-03: 获取当前用户信息', () => {
    describe('AUTH-03-01: 获取当前用户信息成功', () => {
      it('应该返回当前用户信息', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/userinfo')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.id).toBeDefined();
        expect(response.body.data.username).toBe('admin');
        expect(response.body.data.passwordHash).toBeUndefined();
      });
    });

    describe('AUTH-03-02: 未授权访问返回 401', () => {
      it('应该返回未授权访问', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/userinfo')
          .expect(401);

        expect(response.body.code).toBe(401);
        expect(response.body.message).toContain('未授权');
      });
    });

    describe('AUTH-03-03: Token 过期返回 401', () => {
      it('应该返回 Token 已过期', async () => {
        const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired';
        const response = await request(app.getHttpServer())
          .post('/api/auth/userinfo')
          .set('Authorization', `Bearer ${expiredToken}`)
          .expect(401);

        expect(response.body.code).toBe(401);
        expect(response.body.message).toContain('Token');
      });
    });
  });

  // ============================================================================
  // AUTH-04: 退出登录测试
  // ============================================================================
  describe('AUTH-04: 退出登录', () => {
    let tokenToLogout: string;

    beforeAll(async () => {
      // 先登录获取一个用于测试退出的 token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'test',
          password: 'Test@123',
        });
      tokenToLogout = loginResponse.body.data.accessToken;
    });

    describe('AUTH-04-01: 退出登录成功', () => {
      it('应该退出成功', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${tokenToLogout}`)
          .expect(200);

        expect(response.body.code).toBe(0);
        expect(response.body.message).toBe('退出成功');
      });
    });

    describe('AUTH-04-02: 未授权退出返回 401', () => {
      it('应该返回未授权访问', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/logout')
          .expect(401);

        expect(response.body.code).toBe(401);
      });
    });
  });
});

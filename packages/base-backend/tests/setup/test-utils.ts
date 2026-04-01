/**
 * @fileoverview 测试工具函数
 * @description 提供测试中常用的工具函数和辅助方法
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';

/**
 * 测试用户接口
 */
export interface TestUser {
  id: string;
  username: string;
  password: string;
  token?: string;
  refreshToken?: string;
}

/**
 * 默认测试用户
 */
export const DEFAULT_TEST_USERS: TestUser[] = [
  {
    id: '',
    username: 'admin',
    password: 'Admin@123',
  },
  {
    id: '',
    username: 'test',
    password: 'Test@123',
  },
];

/**
 * 登录并获取 Token
 * @param app NestJS 应用实例
 * @param username 用户名
 * @param password 密码
 * @returns 登录响应数据
 */
export async function login(
  app: INestApplication,
  username: string = 'admin',
  password: string = 'Admin@123',
): Promise<{ token: string; refreshToken: string; user: any }> {
  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({
      identifier: username,
      password,
    })
    .expect(200);

  return {
    token: response.body.data.token,
    refreshToken: response.body.data.refreshToken,
    user: response.body.data.user,
  };
}

/**
 * 创建带认证的请求
 * @param app NestJS 应用实例
 * @param token JWT Token
 * @returns 请求构建器
 */
export function authenticatedRequest(
  app: INestApplication,
  token: string,
) {
  return request(app.getHttpServer())
    .set('Authorization', `Bearer ${token}`);
}

/**
 * 生成唯一的测试标识符
 * @param prefix 前缀
 * @returns 唯一标识符
 */
export function generateUniqueIdentifier(prefix: string = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 等待函数
 * @param ms 毫秒数
 * @returns Promise
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 清理测试数据
 * @param app NestJS 应用实例
 * @param token 管理员 Token
 */
export async function cleanupTestData(
  app: INestApplication,
  token: string,
): Promise<void> {
  // 这里可以添加清理测试数据的逻辑
  // 例如：删除测试创建的用户、角色等
  console.log('Cleaning up test data...');
}

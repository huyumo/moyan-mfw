/**
 * @fileoverview 测试设置导出
 * @description 统一导出所有测试相关的工具与配置
 */

// 数据库配置
export { testDatabaseConfig } from './test-db.config';

// 应用工厂
export { createTestApp, getTestToken, createTestClient } from './test-app.factory';
export type { TestAppConfig } from './test-app.factory';

// 测试工具
export {
  login,
  authenticatedRequest,
  generateUniqueIdentifier,
  sleep,
  cleanupTestData,
  DEFAULT_TEST_USERS,
} from './test-utils';
export type { TestUser } from './test-utils';

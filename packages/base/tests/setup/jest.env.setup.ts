/**
 * @fileoverview Jest 环境变量设置
 * @description 在模块加载前设置环境变量（被 setupFiles 引用）
 */

// 设置全局环境变量（在任何其他模块加载之前）
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_integration_testing_only';
process.env.JWT_EXPIRES_IN = '7200';

// 加载 .env.test 文件
import { config } from 'dotenv';
import * as path from 'path';

const rootDir = process.cwd();
const result = config({ path: path.join(rootDir, '.env.test') });

// 覆盖 JWT 配置（确保测试环境使用正确的值）
if (process.env.JWT_SECRET) {
  // 已设置
}

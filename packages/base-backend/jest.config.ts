import type { Config } from 'jest';

// 在配置加载前设置环境变量（确保在模块编译前）
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_integration_testing_only';
process.env.JWT_EXPIRES_IN = '7200';

// 加载 .env.test 文件
import { config as dotenvConfig } from 'dotenv';
import * as path from 'path';
dotenvConfig({ path: path.join(__dirname, '.env.test') });

const config: Config = {
  // 测试框架
  preset: 'ts-jest',
  testEnvironment: 'node',

  // 测试文件匹配
  testRegex: '.*\\.spec\\.ts$',

  // 模块解析
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@database/(.*)$': '<rootDir>/src/database/$1',
  },

  // 路径映射
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // 转换配置
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },

  // 全局设置 - setupFiles 在模块加载前运行
  setupFiles: ['<rootDir>/tests/setup/jest.env.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],

  // 收集覆盖率
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
    '!src/**/*.module.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.types.ts',
    '!src/main.ts',
    '!src/database/migrations/**/*',
    '!src/database/seeds/**/*',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'lcov', 'text', 'text-summary'],

  // 测试超时
  testTimeout: 30000,

  // 顺序执行测试（避免数据库冲突）
  maxWorkers: 1,

  // 详细输出
  verbose: true,

  // 测试失败时停止
  bail: 0,

  // 全局钩子 - 在所有测试前后执行
  globalSetup: '<rootDir>/tests/setup/jest.global-setup.ts',
  globalTeardown: '<rootDir>/tests/setup/jest.global-teardown.ts',
};

export default config;

import type { Config } from 'jest';

// Set environment variables before config loading (ensure before module compilation)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_integration_testing_only';
process.env.JWT_EXPIRES_IN = '7200';

// Load .env.test file
import { config as dotenvConfig } from 'dotenv';
import * as path from 'path';
dotenvConfig({ path: path.join(__dirname, '.env.test') });

const config: Config = {
  // Test framework
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Test file matching
  testRegex: '.*\\.spec\\.ts$',

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/backend/$1',
    '^@common/(.*)$': '<rootDir>/src/backend/common/$1',
    '^@config/(.*)$': '<rootDir>/src/backend/config/$1',
    '^@modules/(.*)$': '<rootDir>/src/backend/modules/$1',
    '^@database/(.*)$': '<rootDir>/src/backend/database/$1',
  },

  // Path mapping
  roots: ['<rootDir>/src/backend', '<rootDir>/tests'],

  // Transform configuration
  // 指向子包 tsconfig（tsconfig.test.json 将在迁移第四阶段删除）
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'src/backend/tsconfig.json',
        types: ['jest', 'node'],
      },
    ],
  },

  // Global setup - setupFiles runs before module loading
  setupFiles: ['<rootDir>/tests/setup/jest.env.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],

  // Coverage collection
  collectCoverage: true,
  collectCoverageFrom: [
    'src/backend/**/*.ts',
    '!src/backend/**/*.dto.ts',
    '!src/backend/**/*.entity.ts',
    '!src/backend/**/*.module.ts',
    '!src/backend/**/*.interface.ts',
    '!src/backend/**/*.types.ts',
    '!src/backend/main.ts',
    '!src/backend/database/migrations/**/*',
    '!src/backend/database/seeds/**/*',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'lcov', 'text', 'text-summary'],

  // Test timeout
  testTimeout: 30000,

  // Sequential test execution (avoid database conflicts)
  maxWorkers: 1,

  // Verbose output
  verbose: true,

  // Stop on failure
  bail: 0,

  // Global hooks - run before and after all tests
  globalSetup: '<rootDir>/tests/setup/jest.global-setup.ts',
  globalTeardown: '<rootDir>/tests/setup/jest.global-teardown.ts',
};

export default config;

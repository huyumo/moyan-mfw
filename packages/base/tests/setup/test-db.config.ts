/**
 * @fileoverview 测试数据库配置
 * @description 用于集成测试的数据库连接配置
 */

import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const testDatabaseConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'test_password',
  database: process.env.DB_NAME || 'test_moyan_mfw',
  charset: 'utf8mb4',
  timezone: '+08:00',
  poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
  synchronize: true, // Enable for testing to auto-create tables
  logging: false,
  entities: [__dirname + '/../../src/backend/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../../src/backend/database/migrations/*{.ts,.js}'],
  migrationsRun: false, // Disable migrations when using synchronize
};

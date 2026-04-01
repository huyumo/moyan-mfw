/**
 * @fileoverview TypeORM 数据源配置
 * @description 用于迁移命令行工具的数据源配置
 */

import { config } from 'dotenv';
import { DataSource } from 'typeorm';

// 加载 .env 文件
config({ path: '.env' });

// 创建数据源实例（直接使用环境变量，不依赖 NestJS 配置模块）
export const dataSourceOptions = {
  type: 'mysql' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'moyan_mfw',
  charset: 'utf8mb4',
  timezone: '+08:00',
  entities: ['src/modules/sys/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
};

// 导出 DataSource 实例供 CLI 使用
export const dataSource = new DataSource(dataSourceOptions);

/**
 * @fileoverview TypeORM 数据源配置
 * @description 用于迁移命令行工具的数据源配置
 */

import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import databaseConfig from '../config/database.config';

// 加载 .env 文件
config({ path: '.env' });

// 导出 DataSource 实例供 CLI 使用
export const dataSource = new DataSource(databaseConfig);

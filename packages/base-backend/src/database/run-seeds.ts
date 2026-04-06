/**
 * @fileoverview 执行种子数据脚本
 */

import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { runSeeds } from './seeds/index';

config({ path: '.env' });

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'moyan_mfw',
  charset: 'utf8mb4',
  synchronize: false,
  logging: false,
  entities: ['src/modules/sys/**/*.entity{.ts,.js}'],
});

async function main(): Promise<void> {
  try {
    await AppDataSource.initialize();
    process.stdout.write('数据库连接成功\n');
    await runSeeds(AppDataSource);
    await AppDataSource.destroy();
    process.stdout.write('完成\n');
  } catch (error) {
    process.stderr.write(`失败: ${error}\n`);
    process.exit(1);
  }
}

main();
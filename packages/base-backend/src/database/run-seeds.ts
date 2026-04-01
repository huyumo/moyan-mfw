/**
 * @fileoverview 种子数据执行脚本
 * @description 用于执行数据库种子数据的独立脚本
 *
 * 使用方式：
 * 1. 确保数据库已创建并配置好 .env 文件
 * 2. 运行：pnpm seed:run
 */

import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { runSeeds } from './seeds';

// 加载 .env 文件
config({ path: '.env' });

/**
 * 创建数据源 - 使用 synchronize 自动同步实体到数据库
 */
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'moyan_mfw',
  charset: 'utf8mb4',
  synchronize: true, // 自动同步实体到数据库
  logging: false, // 关闭日志输出
  entities: [
    'src/modules/sys/**/*.entity{.ts,.js}',
  ],
});

/**
 * 主函数
 */
async function main(): Promise<void> {
  console.log('🚀 开始执行种子数据...\n');

  try {
    // 初始化数据源
    await AppDataSource.initialize();
    console.log('✅ 数据库连接成功，表已同步\n');

    // 执行种子数据
    await runSeeds(AppDataSource);

    console.log('\n🎉 种子数据执行完成！\n');
    console.log('═══════════════════════════════════════');
    console.log('默认账号：');
    console.log('  超级管理员：admin / Admin@123');
    console.log('  测试用户：test / Test@123');
    console.log('═══════════════════════════════════════\n');

    // 关闭连接
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ 种子数据执行失败:', error);
    process.exit(1);
  }
}

// 执行
main();

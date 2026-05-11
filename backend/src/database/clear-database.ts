/**
 * @fileoverview 数据库清理脚本
 * @description 清空所有表数据，用于重新初始化
 *
 * 使用方式：
 * 1. 确保数据库已配置好 .env 文件
 * 2. 运行：pnpm db:clear
 */

import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config({ path: '.env' });

import {
  UserEntity,
  Role,
  Permission,
  AppType,
  App,
  AppMember,
  AuditLog,
} from 'moyan-mfw-base/backend';

import { SupplierMemberProfile } from '../modules/supplier/entities/supplier-member-profile.entity';

const entities = [
  UserEntity,
  Role,
  Permission,
  AppType,
  App,
  AppMember,
  AuditLog,
  SupplierMemberProfile,
];

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'moyan_mfw',
  charset: 'utf8mb4',
  synchronize: false,
  logging: false,
  entities: entities,
});

const tablesToClear = [
  'sys_role_permissions',
  'sys_app_type_permissions',
  'sys_user_roles',
  'sys_user_apps',
  'sys_app_members',
  'sys_permissions',
  'sys_roles',
  'sys_apps',
  'sys_app_types',
  'sys_users',
  'sys_audit_logs',
];

async function clearTables(dataSource: DataSource): Promise<void> {
  process.stdout.write('开始清空数据库表...\n');

  for (const table of tablesToClear) {
    try {
      await dataSource.query(`SET FOREIGN_KEY_CHECKS = 0`);
      await dataSource.query(`TRUNCATE TABLE ${table}`);
      await dataSource.query(`SET FOREIGN_KEY_CHECKS = 1`);
      process.stdout.write(`  已清空表：${table}\n`);
    } catch {
      process.stdout.write(`  表 ${table} 不存在或清空失败，跳过\n`);
    }
  }

  process.stdout.write('数据库表清空完成！\n');
}

async function main(): Promise<void> {
  try {
    await AppDataSource.initialize();
    process.stdout.write('数据库连接成功\n');

    await clearTables(AppDataSource);

    await AppDataSource.destroy();
    process.stdout.write('数据库连接已关闭\n');
  } catch (error) {
    process.stderr.write(`数据库清理失败: ${error}\n`);
    process.exit(1);
  }
}

main();
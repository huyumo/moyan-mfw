/**
 * @fileoverview 执行种子数据脚本
 */

import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { runSeeds } from 'moyan-base-backend';

config({ path: '.env' });

import {
  UserEntity,
  Role,
  Permission,
  AppType,
  App,
  AppMember,
  AuditLog,
} from 'moyan-base-backend';

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
  entities: entities,
});

async function main(): Promise<void> {
  try {
    await AppDataSource.initialize();
    process.stdout.write('数据库连接成功\n');
    await runSeeds(AppDataSource, process.env.ADMIN_DEFAULT_PASSWORD);
    await AppDataSource.destroy();
    process.stdout.write('完成\n');
  } catch (error) {
    process.stderr.write(`失败: ${error}\n`);
    process.exit(1);
  }
}

main();
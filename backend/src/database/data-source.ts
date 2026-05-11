/**
 * @fileoverview TypeORM 数据源配置
 * @description 用于迁移命令行工具的数据源配置
 */

import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

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

export const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'moyan_mfw',
  charset: 'utf8mb4',
  timezone: '+08:00',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: entities,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
} as DataSourceOptions);
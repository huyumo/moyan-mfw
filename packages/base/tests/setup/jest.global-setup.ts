/**
 * @fileoverview Jest 全局设置 - 在所有测试之前执行
 * @description 用于初始化数据库连接和清理测试数据
 */

import { createConnection, Connection } from 'typeorm';
import { runSeeds } from '../../src/backend/database/seeds/index';

// 全局测试超时
const GLOBAL_TEST_TIMEOUT = 120000; // 120 秒

/**
 * 检查数据库是否为空状态（无 sys_* 表）
 */
async function isDatabaseEmpty(connection: Connection, dbName: string): Promise<boolean> {
  const queryRunner = connection.createQueryRunner();
  try {
    const tables = await queryRunner.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME LIKE 'sys_%'
    `, [dbName]);
    return tables.length === 0;
  } finally {
    await queryRunner.release();
  }
}

/**
 * 清理所有 sys_* 表
 */
async function cleanupSysTables(connection: Connection, dbName: string): Promise<void> {
  const queryRunner = connection.createQueryRunner();
  try {
    // 禁用外键检查
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

    // 获取所有 sys_ 开头的表名
    const tables = await queryRunner.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME LIKE 'sys_%'
    `, [dbName]);

    console.log(`[GlobalSetup] Found ${tables.length} sys_ tables to clean`);

    // 删除所有 sys_ 开头的表
    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS \`${table.TABLE_NAME}\``);
      console.log(`[GlobalSetup] Dropped table: ${table.TABLE_NAME}`);
    }

    console.log('[GlobalSetup] All sys_ tables dropped');

    // 启用外键检查
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    await queryRunner.release();
  }
}

/**
 * 创建测试数据库（如果不存在）
 */
async function createTestDatabase(
  dbHost: string,
  dbPort: number,
  dbUsername: string,
  dbPassword: string,
  dbName: string
): Promise<void> {
  console.log(`[GlobalSetup] Checking if database '${dbName}' exists...`);

  // 连接到 MySQL 服务器（不指定数据库）
  const connection = await createConnection({
    type: 'mysql',
    host: dbHost,
    port: dbPort,
    username: dbUsername,
    password: dbPassword,
    charset: 'utf8mb4',
    timezone: '+08:00',
    synchronize: false,
    logging: false,
  } as any);

  try {
    // 检查数据库是否存在
    const result = await connection.query(`
      SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?
    `, [dbName]);

    if (result.length === 0) {
      console.log(`[GlobalSetup] Creating database '${dbName}'...`);
      await connection.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`[GlobalSetup] Database '${dbName}' created successfully`);
    } else {
      console.log(`[GlobalSetup] Database '${dbName}' already exists`);
    }
  } finally {
    await connection.close();
  }
}

/**
 * 全局设置 - 在所有测试之前执行
 */
export default async function globalSetup() {
  console.log('[GlobalSetup] Starting test environment setup...');

  // 设置全局超时
  (global as any).TEST_TIMEOUT = GLOBAL_TEST_TIMEOUT;

  // 获取数据库配置
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
  const dbUsername = process.env.DB_USERNAME || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'test_moyan_mfw';

  console.log(`[GlobalSetup] Target database: ${dbName}@${dbHost}:${dbPort}`);

  try {
    // 确保测试数据库存在
    await createTestDatabase(dbHost, dbPort, dbUsername, dbPassword, dbName);

    // 创建数据库连接
    const connection = await createConnection({
      type: 'mysql',
      host: dbHost,
      port: dbPort,
      username: dbUsername,
      password: dbPassword,
      database: dbName,
      charset: 'utf8mb4',
      timezone: '+08:00',
      synchronize: false,
      logging: false,
      entities: [__dirname + '/../../src/backend/modules/sys/**/*.entity{.ts,.js}'],
    } as any);

    console.log('[GlobalSetup] Database connection established');

    // 检查数据库是否为空
    const isEmpty = await isDatabaseEmpty(connection, dbName);

    if (isEmpty) {
      console.log('[GlobalSetup] Database is empty, initializing with seed data...');

      // 关闭当前连接
      await connection.close();

      // 创建新连接，启用 synchronize 来创建表结构
      const newConnection = await createConnection({
        type: 'mysql',
        host: dbHost,
        port: dbPort,
        username: dbUsername,
        password: dbPassword,
        database: dbName,
        charset: 'utf8mb4',
        timezone: '+08:00',
        synchronize: true,
        logging: false,
        entities: [__dirname + '/../../src/backend/modules/sys/**/*.entity{.ts,.js}'],
      } as any);

      console.log('[GlobalSetup] Database schema synchronized');

      // 调用种子数据初始化（复用 runSeeds 函数）
      await runSeeds(newConnection, 'Admin@123');

      console.log('[GlobalSetup] Seed data initialized');

      // 更新 global 对象中的连接
      (global as any).TEST_DB_CONNECTION = newConnection;
    } else {
      console.log('[GlobalSetup] Database is not empty, cleaning and re-initializing...');

      // 清理现有表
      await cleanupSysTables(connection, dbName);

      // 关闭当前连接
      await connection.close();

      // 创建新连接，启用 synchronize 来重建表结构
      const newConnection = await createConnection({
        type: 'mysql',
        host: dbHost,
        port: dbPort,
        username: dbUsername,
        password: dbPassword,
        database: dbName,
        charset: 'utf8mb4',
        timezone: '+08:00',
        synchronize: true,
        logging: false,
        entities: [__dirname + '/../../src/backend/modules/sys/**/*.entity{.ts,.js}'],
      } as any);

      console.log('[GlobalSetup] Database schema synchronized');

      // 调用种子数据初始化（复用 runSeeds 函数）
      await runSeeds(newConnection, 'Admin@123');

      console.log('[GlobalSetup] Seed data initialized');

      // 更新 global 对象中的连接
      (global as any).TEST_DB_CONNECTION = newConnection;
    }

    // 存储种子数据 ID 供测试使用（从 runSeeds 后查询获取）
    const adminUser = await (global as any).TEST_DB_CONNECTION.manager.findOne(
      'sys_users',
      { where: { username: 'admin' } }
    );
    const systemAppType = await (global as any).TEST_DB_CONNECTION.manager.findOne(
      'sys_app_types',
      { where: { typeCode: 'system' } }
    );
    const superAdminRole = await (global as any).TEST_DB_CONNECTION.manager.findOne(
      'sys_roles',
      { where: { roleCode: 'super_admin' } }
    );

    (global as any).SEED_DATA = {
      adminUserId: adminUser?.id || '',
      adminTypeId: systemAppType?.id || '',
      adminRoleId: superAdminRole?.id || '',
    };

    console.log('[GlobalSetup] Test environment setup complete');
    console.log(`[GlobalSetup] Seed data IDs: adminUserId=${(global as any).SEED_DATA.adminUserId}`);
  } catch (error) {
    console.error('[GlobalSetup] Error during setup:', error);
    throw error;
  }
}
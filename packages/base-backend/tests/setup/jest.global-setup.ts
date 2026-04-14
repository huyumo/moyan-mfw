/**
 * @fileoverview Jest 全局设置 - 在所有测试之前执行
 * @description 用于初始化数据库连接和清理测试数据
 */

import { createConnection, Connection } from 'typeorm';

// 全局测试超时
const GLOBAL_TEST_TIMEOUT = 120000; // 120 秒

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
  const dbPassword = process.env.DB_PASSWORD || 'password';
  const dbName = process.env.DB_NAME || 'moyan_mfw';

  console.log(`[GlobalSetup] Connecting to database: ${dbName}@${dbHost}`);

  try {
    // 创建数据库连接（不指定 synchronize）
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
      entities: [__dirname + '/../../src/modules/sys/**/*.entity{.ts,.js}'],
    } as any);

    console.log('[GlobalSetup] Database connection established');

    // 将连接存储到 global 对象，供 teardown 使用
    (global as any).TEST_DB_CONNECTION = connection;

    // 获取 QueryRunner
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

      console.log(`[GlobalSetup] Found ${tables.length} sys_ tables`);

      // 删除所有 sys_ 开头的表
      for (const table of tables) {
        await queryRunner.query(`DROP TABLE IF EXISTS \`${table.TABLE_NAME}\``);
        console.log(`[GlobalSetup] Dropped table: ${table.TABLE_NAME}`);
      }

      console.log('[GlobalSetup] All sys_ tables dropped');

      // 启用外键检查
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');

      // 释放 QueryRunner
      await queryRunner.release();

      // 重新创建数据库连接，启用 synchronize 来重建表结构
      await connection.close();

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
        entities: [__dirname + '/../../src/modules/sys/**/*.entity{.ts,.js}'],
      } as any);

      console.log('[GlobalSetup] Database schema synchronized');

      // 更新 global 对象中的连接
      (global as any).TEST_DB_CONNECTION = newConnection;

      // 插入测试种子数据
      console.log('[GlobalSetup] Inserting seed data...');

      // 插入 admin 用户（密码：Admin@123 的 bcrypt 哈希）
      // 使用有效的 UUID v4 格式
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      const adminUserId = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';
      const adminTypeId = 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e';
      const adminRoleId = 'c3d4e5f6-a7b8-4c5d-8e9f-0a1b2c3d4e5f'; // 有效的 UUID v4

      await newConnection.query(`
        INSERT INTO sys_users (id, username, nickname, password, userStatus, isDeveloper, created_at)
        VALUES ('${adminUserId}', 'admin', '管理员', ?, 1, 1, NOW())
      `, [hashedPassword]);

      console.log('[GlobalSetup] Admin user created (ID:', adminUserId, ')');

      // 插入默认应用类型
      await newConnection.query(`
        INSERT INTO sys_app_types (id, typeName, typeCode, typeDesc, typeStatus, sortOrder, created_at)
        VALUES ('${adminTypeId}', '默认应用类型', 'DEFAULT', '系统默认的应用类型', 1, 0, NOW())
      `);

      console.log('[GlobalSetup] Default app type created (ID:', adminTypeId, ')');

      // 插入默认角色（管理员角色）- 关联到默认应用类型
      await newConnection.query(`
        INSERT INTO sys_roles (id, appTypeId, roleName, roleCode, isBuiltin, isOwner, sortOrder, created_at)
        VALUES ('${adminRoleId}', '${adminTypeId}', '管理员', 'admin', 1, 0, 0, NOW())
      `);

      console.log('[GlobalSetup] Default role created (ID:', adminRoleId, ')');

      // 给用户分配管理员角色
      const userRoleId = 'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a';
      await newConnection.query(`
        INSERT INTO sys_user_roles (id, userId, roleId, created_at)
        VALUES ('${userRoleId}', '${adminUserId}', '${adminRoleId}', NOW())
      `);

      console.log('[GlobalSetup] Admin role assigned to admin user');

      // 插入第二个测试用户（用于 MEMBER 测试）
      const testUserId2 = 'f6ab2e33-9e8f-4f52-b8f3-95975f727612';
      await newConnection.query(`
        INSERT INTO sys_users (id, username, nickname, password, userStatus, isDeveloper, created_at)
        VALUES ('${testUserId2}', 'testuser', '测试用户', ?, 1, 0, NOW())
      `, [hashedPassword]);

      console.log('[GlobalSetup] Test user created (ID:', testUserId2, ')');

      // 插入 test 用户（用于权限测试 - 仅有 VIEW 权限）
      const testUser3Id = 'd5e6f7a8-b9c0-4d5e-3f4a-5b6c7d8e9f0a';
      const testUserHashedPassword = await bcrypt.hash('Test@123', 10);
      await newConnection.query(`
        INSERT INTO sys_users (id, username, nickname, password, userStatus, isDeveloper, created_at)
        VALUES ('${testUser3Id}', 'test', '测试员', ?, 1, 0, NOW())
      `, [testUserHashedPassword]);

      console.log('[GlobalSetup] Test user (test) created (ID:', testUser3Id, ')');

      // 插入 test 角色（仅有 VIEW 权限）- 关联到默认应用类型
      const testRoleId2 = 'e6f7a8b9-c0d1-4e6f-4a5b-6c7d8e9f0a1b';
      await newConnection.query(`
        INSERT INTO sys_roles (id, appTypeId, roleName, roleCode, isBuiltin, isOwner, sortOrder, created_at)
        VALUES ('${testRoleId2}', '${adminTypeId}', '测试角色', 'test', 1, 0, 0, NOW())
      `);

      console.log('[GlobalSetup] Test role created (ID:', testRoleId2, ')');

      // 给 test 用户分配 test 角色
      const testUserRoleId = 'f7a8b9c0-d1e2-4f7a-5b6c-7d8e9f0a1b2c';
      await newConnection.query(`
        INSERT INTO sys_user_roles (id, userId, roleId, created_at)
        VALUES ('${testUserRoleId}', '${testUser3Id}', '${testRoleId2}', NOW())
      `);

      console.log('[GlobalSetup] Test role assigned to test user');

      // 插入默认权限数据（用于权限模块测试）
      const testPermId = 'a1b2c3d4-1234-4a5b-8c9d-0e1f2a3b4c5d';
      await newConnection.query(`
        INSERT INTO sys_permissions (id, permName, permCode, permDesc, permissionType, nodeType, created_at)
        VALUES ('${testPermId}', '测试权限', 'test-permission', '用于测试的权限', 'NORMAL', 'MENU', NOW())
      `);

      console.log('[GlobalSetup] Test permission created (ID:', testPermId, ')');

      // 插入 system:user 权限（用于 PERM-01-02 测试）
      const systemUserPermId = 'b2c3d4e5-2345-4b5c-9d0e-1f2a3b4c5d6e';
      await newConnection.query(`
        INSERT INTO sys_permissions (id, permName, permCode, permDesc, permissionType, nodeType, created_at)
        VALUES ('${systemUserPermId}', '用户管理', 'system:user', '用户管理权限', 'NORMAL', 'MENU', NOW())
      `);

      console.log('[GlobalSetup] system:user permission created (ID:', systemUserPermId, ')');

      // 存储 ID 到 global 对象供测试使用
      (global as any).SEED_DATA = {
        adminUserId,
        adminTypeId,
        adminRoleId,
        testUserId2,
        testUser3Id,
        testPermId,
        systemUserPermId,
      };

      console.log('[GlobalSetup] Seed data inserted');

      console.log('[GlobalSetup] Test environment setup complete');
    } catch (error) {
      // 发生错误时也要尝试释放 QueryRunner
      try {
        await queryRunner.release();
      } catch (e) {
        // 忽略释放错误
      }
      throw error;
    }
  } catch (error) {
    console.error('[GlobalSetup] Error during setup:', error);
    throw error;
  }
}

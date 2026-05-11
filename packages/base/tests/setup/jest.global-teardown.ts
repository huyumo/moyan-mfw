/**
 * @fileoverview Jest 全局清理 - 在所有测试之后执行
 * @description 用于关闭数据库连接和清理测试环境
 */

/**
 * 清理所有 sys_* 表数据
 */
async function cleanupSysTables(connection: any, dbName: string): Promise<void> {
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

    console.log(`[GlobalTeardown] Found ${tables.length} sys_ tables to clean`);

    // 按照依赖顺序清空表数据（使用 TRUNCATE 比 DELETE 更快）
    const tablesToTruncate = [
      'sys_role_permissions',
      'sys_app_type_permissions',
      'sys_user_roles',
      'sys_user_apps',
      'sys_app_members',
      'sys_audit_logs',
      'sys_permissions',
      'sys_roles',
      'sys_apps',
      'sys_app_types',
      'sys_users',
    ];

    for (const table of tablesToTruncate) {
      try {
        await queryRunner.query(`TRUNCATE TABLE \`${table}\``);
        console.log(`[GlobalTeardown] Truncated table: ${table}`);
      } catch {
        // 表可能不存在，忽略错误
        console.log(`[GlobalTeardown] Table ${table} not found or truncate failed, skipping`);
      }
    }

    // 启用外键检查
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('[GlobalTeardown] All sys_ tables cleaned');
  } finally {
    await queryRunner.release();
  }
}

/**
 * 全局清理 - 在所有测试之后执行
 */
export default async function globalTeardown() {
  console.log('[GlobalTeardown] Starting test environment cleanup...');

  try {
    // 获取数据库连接
    const connection = (global as any).TEST_DB_CONNECTION;
    const dbName = process.env.DB_NAME || 'test_moyan_mfw';

    if (connection && connection.isConnected) {
      // 清理所有 sys_* 表数据
      await cleanupSysTables(connection, dbName);

      // 关闭数据库连接
      await connection.close();
      console.log('[GlobalTeardown] Database connection closed');
    }

    console.log('[GlobalTeardown] Test environment cleanup complete');
  } catch (error) {
    console.error('[GlobalTeardown] Error during cleanup:', error);
    // 不抛出错误，允许测试正常结束
  }
}
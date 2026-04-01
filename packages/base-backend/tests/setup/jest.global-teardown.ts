/**
 * @fileoverview Jest 全局清理 - 在所有测试之后执行
 * @description 用于关闭数据库连接和清理测试环境
 */

/**
 * 全局清理 - 在所有测试之后执行
 */
export default async function globalTeardown() {
  console.log('[GlobalTeardown] Starting test environment cleanup...');

  try {
    // 关闭数据库连接
    const connection = (global as any).TEST_DB_CONNECTION;
    if (connection && connection.isConnected) {
      await connection.close();
      console.log('[GlobalTeardown] Database connection closed');
    }

    console.log('[GlobalTeardown] Test environment cleanup complete');
  } catch (error) {
    console.error('[GlobalTeardown] Error during cleanup:', error);
    throw error;
  }
}

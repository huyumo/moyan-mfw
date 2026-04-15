/**
 * @fileoverview SQL 工具函数
 * @description 提供通用的 SQL 执行和参数处理方法
 */

import { EntityManager } from 'typeorm';

/**
 * 执行原生 SQL 并处理命名参数
 * @param entityManager - TypeORM 实体管理器
 * @param sql - SQL 语句，支持命名参数占位符（如 :userId）
 * @param params - 参数对象，键名对应 SQL 中的占位符
 * @returns 查询结果数组
 *
 * @example
 * ```typescript
 * const sql = 'SELECT * FROM users WHERE id = :userId AND status = :status';
 * const result = await executeRawSql(entityManager, sql, { userId: 123, status: 'active' });
 * // 转换为: SELECT * FROM users WHERE id = 123 AND status = 'active'
 * ```
 */
export async function executeRawSql<T = any>(
  entityManager: EntityManager,
  sql: string,
  params: Record<string, number | bigint | string>,
): Promise<T[]> {
  let processedSql = sql;

  for (const [key, value] of Object.entries(params)) {
    const placeholder = `:${key}`;
    let replacement: string;

    if (typeof value === 'string') {
      replacement = `'${value.replace(/'/g, "''")}'`;
    } else if (typeof value === 'bigint') {
      replacement = value.toString();
    } else if (typeof value === 'number') {
      replacement = value.toString();
    } else {
      replacement = String(value);
    }

    processedSql = processedSql.replace(new RegExp(placeholder, 'g'), replacement);
  }

  return entityManager.query(processedSql);
}

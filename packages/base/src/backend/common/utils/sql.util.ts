/**
 * @fileoverview SQL 工具函数
 * @description 提供通用的 SQL 执行和参数处理方法
 */

import { DataSource, EntityManager } from 'typeorm';

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
  entityManager: EntityManager | DataSource,
  sql: string,
  params: Record<string, any>,
  printSql: boolean = false,
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
    } else if (value === null) {
      replacement = 'NULL';
    } else {
      replacement = String(value);
    }

    processedSql = processedSql.replace(new RegExp(placeholder, 'g'), replacement);
  }

  if (printSql) {
    console.log('执行 SQL:', processedSql);
  }

  return entityManager.query(processedSql);
}

/**
 * WHERE 条件构建器
 * @description 用于构建原生 SQL 的 WHERE 条件，支持参数化查询防止 SQL 注入
 *
 * @example
 * ```typescript
 * // 基础用法
 * const builder = new WhereBuilder();
 * builder
 *   .eq('status', 'active')
 *   .gt('age', 18)
 *   .in('type', ['A', 'B']);
 *
 * const { where, params } = builder.build();
 * // where: "WHERE status = :status_0 AND age > :age_1 AND type IN (:type_2, :type_3)"
 * // params: { status_0: 'active', age_1: 18, type_2: 'A', type_3: 'B' }
 * ```
 *
 * @example
 * ```typescript
 * // 自动过滤 undefined 值
 * const { status, age, type } = query;
 * const builder = new WhereBuilder();
 * builder
 *   .eq('status', status)
 *   .gt('age', age)
 *   .in('type', type);
 *
 * const { where, params } = builder.build();
 * // 如果 status === undefined，则不会添加该条件
 * // where: "WHERE age > :age_0 AND type IN (:type_1, :type_2)"
 * // params: { age_0: 18, type_1: 'A', type_2: 'B' }
 * ```
 *
 * @example
 * ```typescript
 * // 使用 OR 条件
 * const builder = new WhereBuilder();
 * builder
 *   .eq('status', 'active')
 *   .eq('type', 'admin', 'OR');
 *
 * const { where, params } = builder.build();
 * // where: "WHERE status = :status_0 OR type = :type_1"
 * // params: { status_0: 'active', type_1: 'admin' }
 * ```
 *
 * @example
 * ```typescript
 * // 使用条件分组（括号）
 * const builder = new WhereBuilder();
 * const subBuilder = new WhereBuilder();
 * subBuilder
 *   .eq('type', 'A')
 *   .eq('type', 'B', 'OR');
 *
 * builder
 *   .eq('status', 'active')
 *   .group(subBuilder);
 *
 * const { where, params } = builder.build();
 * // where: "WHERE status = :status_0 AND (type = :type_1 OR type = :type_2)"
 * // params: { status_0: 'active', type_1: 'A', type_2: 'B' }
 * ```
 *
 * @example
 * ```typescript
 * // 复杂条件：WHERE r.roleCode IS NULL AND ((r.appTypeId IS NOT NULL AND a.id IS NOT NULL) OR (r.isBuiltin = 1))
 * const builder = new WhereBuilder();
 *
 * // 构建第一个子条件组：(r.appTypeId IS NOT NULL AND a.id IS NOT NULL)
 * const subBuilder1 = new WhereBuilder();
 * subBuilder1
 *   .isNotNull('r.appTypeId')
 *   .isNotNull('a.id');
 *
 * // 构建第二个子条件组：(r.isBuiltin = 1)
 * const subBuilder2 = new WhereBuilder();
 * subBuilder2.eq('r.isBuiltin', 1);
 *
 * // 构建外层条件组：((r.appTypeId IS NOT NULL AND a.id IS NOT NULL) OR (r.isBuiltin = 1))
 * const outerBuilder = new WhereBuilder();
 * outerBuilder
 *   .group(subBuilder1)
 *   .group(subBuilder2, 'OR');
 *
 * // 最终条件
 * builder
 *   .isNull('r.roleCode')
 *   .group(outerBuilder);
 *
 * const { where, params } = builder.build();
 * // where: "WHERE r.roleCode IS NULL AND ((r.appTypeId IS NOT NULL AND a.id IS NOT NULL) OR (r.isBuiltin = :isBuiltin_0))"
 * // params: { isBuiltin_0: 1 }
 * ```
 *
 * @example
 * ```typescript
 * // 模糊查询
 * const builder = new WhereBuilder();
 * builder
 *   .like('name', 'john')
 *   .likeLeft('code', 'A')
 *   .likeRight('email', '@example.com');
 *
 * const { where, params } = builder.build();
 * // where: "WHERE name LIKE :name_0 AND code LIKE :code_1 AND email LIKE :email_2"
 * // params: { name_0: '%john%', code_1: 'A%', email_2: '%@example.com' }
 * ```
 *
 * @example
 * ```typescript
 * // 范围查询
 * const builder = new WhereBuilder();
 * builder
 *   .between('age', 18, 65)
 *   .gte('score', 60)
 *   .lte('price', 1000);
 *
 * const { where, params } = builder.build();
 * // where: "WHERE age BETWEEN :age_0 AND :age_1 AND score >= :score_2 AND price <= :price_3"
 * // params: { age_0: 18, age_1: 65, score_2: 60, price_3: 1000 }
 * ```
 *
 * @example
 * ```typescript
 * // 使用自定义条件
 * const builder = new WhereBuilder();
 * builder
 *   .eq('status', 'active')
 *   .custom('DATE(created_at) = CURRENT_DATE', {})
 *   .custom('JSON_CONTAINS(tags, :tag)', { tag: JSON.stringify('important') });
 *
 * const { where, params } = builder.build();
 * // where: "WHERE status = :status_0 AND DATE(created_at) = CURRENT_DATE AND JSON_CONTAINS(tags, :tag)"
 * // params: { status_0: 'active', tag: '"important"' }
 * ```
 *
 * @example
 * ```typescript
 * // 重置构建器
 * const builder = new WhereBuilder();
 * builder.eq('status', 'active');
 * const result1 = builder.build();
 *
 * builder.reset();
 * builder.eq('type', 'admin');
 * const result2 = builder.build();
 * ```
 */
export class WhereBuilder {
  private conditions: string[] = [];
  private params: Record<string, any> = {};
  private paramIndex = 0;

  /**
   * 添加等于条件
   * @param field - 字段名
   * @param value - 值
   * @param logicalOperator - 逻辑连接符（AND/OR）
   */
  eq(field: string, value?: any, logicalOperator: 'AND' | 'OR' = 'AND'): this {
    if (value === undefined) {
      return this;
    }
    return this.addCondition(field, '=', value, logicalOperator);
  }

  /**
   * 添加不等于条件
   * @param field - 字段名
   * @param value - 值
   * @param logicalOperator - 逻辑连接符（AND/OR）
   */
  neq(field: string, value?: any, logicalOperator: 'AND' | 'OR' = 'AND'): this {
    if (value === undefined) {
      return this;
    }
    return this.addCondition(field, '!=', value, logicalOperator);
  }

  /**
   * 添加大于条件
   * @param field - 字段名
   * @param value - 值
   * @param logicalOperator - 逻辑连接符（AND/OR）
   */
  gt(field: string, value?: any, logicalOperator: 'AND' | 'OR' = 'AND'): this {
    if (value === undefined) {
      return this;
    }
    return this.addCondition(field, '>', value, logicalOperator);
  }

  /**
   * 添加大于等于条件
   * @param field - 字段名
   * @param value - 值
   * @param logicalOperator - 逻辑连接符（AND/OR）
   */
  gte(field: string, value?: any, logicalOperator: 'AND' | 'OR' = 'AND'): this {
    if (value === undefined) {
      return this;
    }
    return this.addCondition(field, '>=', value, logicalOperator);
  }

  /**
   * 添加小于条件
   * @param field - 字段名
   * @param value - 值
   * @param logicalOperator - 逻辑连接符（AND/OR）
   */
  lt(field: string, value?: any, logicalOperator: 'AND' | 'OR' = 'AND'): this {
    if (value === undefined) {
      return this;
    }
    return this.addCondition(field, '<', value, logicalOperator);
  }

  /**
   * 添加小于等于条件
   * @param field - 字段名
   * @param value - 值
   * @param logicalOperator - 逻辑连接符（AND/OR）
   */
  lte(field: string, value?: any, logicalOperator: 'AND' | 'OR' = 'AND'): this {
    if (value === undefined) {
      return this;
    }
    return this.addCondition(field, '<=', value, logicalOperator);
  }

  /**
   * 添加 LIKE 条件（包含）
   * @param field - 字段名
   * @param value - 值
   * @param logicalOperator - 逻辑连接符（AND/OR）
   */
  like(field: string, value?: string, logicalOperator: 'AND' | 'OR' = 'AND'): this {
    if (value === undefined) {
      return this;
    }
    return this.addCondition(field, 'LIKE', `%${value}%`, logicalOperator);
  }

  /**
   * 添加 LIKE 条件（左匹配）
   * @param field - 字段名
   * @param value - 值
   * @param logicalOperator - 逻辑连接符（AND/OR）
   */
  likeLeft(field: string, value?: string, logicalOperator: 'AND' | 'OR' = 'AND'): this {
    if (value === undefined) {
      return this;
    }
    return this.addCondition(field, 'LIKE', `${value}%`, logicalOperator);
  }

  /**
   * 添加 LIKE 条件（右匹配）
   * @param field - 字段名
   * @param value - 值
   * @param logicalOperator - 逻辑连接符（AND/OR）
   */
  likeRight(field: string, value?: string, logicalOperator: 'AND' | 'OR' = 'AND'): this {
    if (value === undefined) {
      return this;
    }
    return this.addCondition(field, 'LIKE', `%${value}`, logicalOperator);
  }

  /**
   * 添加 IN 条件
   * @param field - 字段名
   * @param values - 值数组
   * @param logicalOperator - 逻辑连接符（AND/OR）
   */
  in(field: string, values?: any[], logicalOperator: 'AND' | 'OR' = 'AND'): this {
    if (!values || values.length === 0) {
      return this;
    }

    const filteredValues = values.filter((v) => v !== undefined);
    if (filteredValues.length === 0) {
      return this;
    }

    const placeholders = filteredValues.map((value) => {
      const paramName = this.generateParamName(field);
      this.params[paramName] = value;
      return `:${paramName}`;
    });

    const condition = `${field} IN (${placeholders.join(', ')})`;
    this.conditions.push(`${logicalOperator} ${condition}`);
    return this;
  }

  /**
   * 添加 NOT IN 条件
   * @param field - 字段名
   * @param values - 值数组
   * @param logicalOperator - 逻辑连接符（AND/OR）
   */
  notIn(field: string, values?: any[], logicalOperator: 'AND' | 'OR' = 'AND'): this {
    if (!values || values.length === 0) {
      return this;
    }

    const filteredValues = values.filter((v) => v !== undefined);
    if (filteredValues.length === 0) {
      return this;
    }

    const placeholders = filteredValues.map((value) => {
      const paramName = this.generateParamName(field);
      this.params[paramName] = value;
      return `:${paramName}`;
    });

    const condition = `${field} NOT IN (${placeholders.join(', ')})`;
    this.conditions.push(`${logicalOperator} ${condition}`);
    return this;
  }

  /**
   * 添加 BETWEEN 条件
   * @param field - 字段名
   * @param min - 最小值
   * @param max - 最大值
   * @param logicalOperator - 逻辑连接符（AND/OR）
   */
  between(field: string, min: any, max: any, logicalOperator: 'AND' | 'OR' = 'AND'): this {
    if (min === undefined || max === undefined) {
      return this;
    }
    const minParam = this.generateParamName(field);
    const maxParam = this.generateParamName(field);
    this.params[minParam] = min;
    this.params[maxParam] = max;

    const condition = `${field} BETWEEN :${minParam} AND :${maxParam}`;
    this.conditions.push(`${logicalOperator} ${condition}`);
    return this;
  }

  /**
   * 添加 IS NULL 条件
   * @param field - 字段名
   * @param logicalOperator - 逻辑连接符（AND/OR）
   */
  isNull(field: string, logicalOperator: 'AND' | 'OR' = 'AND'): this {
    const condition = `${field} IS NULL`;
    this.conditions.push(`${logicalOperator} ${condition}`);
    return this;
  }

  /**
   * 添加 IS NOT NULL 条件
   * @param field - 字段名
   * @param logicalOperator - 逻辑连接符（AND/OR）
   */
  isNotNull(field: string, logicalOperator: 'AND' | 'OR' = 'AND'): this {
    const condition = `${field} IS NOT NULL`;
    this.conditions.push(`${logicalOperator} ${condition}`);
    return this;
  }

  /**
   * 添加自定义条件
   * @param condition - 条件字符串
   * @param params - 参数对象
   * @param logicalOperator - 逻辑连接符（AND/OR）
   */
  custom(condition: string, params: Record<string, any> = {}, logicalOperator: 'AND' | 'OR' = 'AND'): this {
    this.conditions.push(`${logicalOperator} ${condition}`);
    Object.assign(this.params, params);
    return this;
  }

  /**
   * 添加 AND 条件
   * @param field - 字段名
   * @param operator - 操作符
   * @param value - 值
   */
  andWhere(field: string, operator: string, value: any): this {
    if (value === undefined) {
      return this;
    }
    return this.addCondition(field, operator, value, 'AND');
  }

  /**
   * 添加 OR 条件
   * @param field - 字段名
   * @param operator - 操作符
   * @param value - 值
   */
  orWhere(field: string, operator: string, value: any): this {
    if (value === undefined) {
      return this;
    }
    return this.addCondition(field, operator, value, 'OR');
  }

  /**
   * 添加条件组（使用括号包裹）
   * @param builder - 子条件构建器
   * @param logicalOperator - 逻辑连接符（AND/OR）
   */
  group(builder: WhereBuilder, logicalOperator: 'AND' | 'OR' = 'AND'): this {
    const { where, params } = builder.build();
    if (where) {
      const condition = where.replace('WHERE ', '');
      this.conditions.push(`${logicalOperator} (${condition})`);
      Object.assign(this.params, params);
    }
    return this;
  }

  /**
   * 构建 WHERE 子句和参数
   * @returns 包含 where 子句和参数的对象
   */
  build(): { where: string; params: Record<string, any> } {
    if (this.conditions.length === 0) {
      return { where: '', params: {} };
    }

    const whereClause = 'WHERE ' + this.conditions.join(' ').replace(/^(AND|OR)\s+/, '');
    return { where: whereClause, params: { ...this.params } };
  }

  /**
   * 重置构建器
   */
  reset(): this {
    this.conditions = [];
    this.params = {};
    this.paramIndex = 0;
    return this;
  }

  /**
   * 手动添加参数（用于 SQL 中需要额外参数的场景）
   * @param name - 参数名
   * @param value - 参数值
   */
  addParam(name: string, value: any): this {
    this.params[name] = value;
    return this;
  }

  /**
   * 添加通用条件
   * @param field - 字段名
   * @param operator - 操作符
   * @param value - 值
   * @param logicalOperator - 逻辑连接符
   */
  private addCondition(field: string, operator: string, value: any, logicalOperator: 'AND' | 'OR'): this {
    const paramName = this.generateParamName(field);
    this.params[paramName] = value;
    const condition = `${field} ${operator} :${paramName}`;
    this.conditions.push(`${logicalOperator} ${condition}`);
    return this;
  }

  /**
   * 生成参数名
   * @param field - 字段名
   * @returns 参数名
   */
  private generateParamName(field: string): string {
    const sanitizedField = field.replace(/\./g, '_');
    const paramName = `${sanitizedField}_${this.paramIndex}`;
    this.paramIndex++;
    return paramName;
  }
}

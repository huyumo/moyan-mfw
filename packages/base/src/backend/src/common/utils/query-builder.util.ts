/**
 * @fileoverview 查询条件构建工具类
 * @description 提供通用的查询条件构建方法，减少重复代码
 */

import { SelectQueryBuilder } from 'typeorm';

/**
 * 查询条件配置
 * @description 定义查询字段、值和操作符
 */
export interface QueryCondition<T = any> {
  /** 字段名（带别名，如 'appType.typeName'） */
  field: string;
  /** 查询值 */
  value?: T;
  /** 操作符 */
  operator?:
    | '='
    | '!='
    | '>'
    | '<'
    | '>='
    | '<='
    | 'like'
    | 'like_left'
    | 'like_right'
    | 'in'
    | 'not_in'
    | 'between'
    | 'is_null'
    | 'is_not_null';
  /** 参数名（可选，默认使用 field） */
  paramName?: string;
  /** 逻辑连接符（可选，默认 AND） */
  logicalOperator?: 'AND' | 'OR';
}

/**
 * 条件组配置
 * @description 支持嵌套的 AND/OR 条件组，用于复杂查询场景
 */
export interface ConditionGroup {
  /** 组内逻辑连接符 */
  logicalOperator: 'AND' | 'OR';
  /** 条件列表（可以是单个条件或嵌套组） */
  conditions: (QueryCondition | ConditionGroup)[];
}

/**
 * 查询条件构建器
 * @description 链式构建 TypeORM 查询条件
 */
export class QueryBuilderHelper {
  /**
   * 应用多个查询条件
   * @param qb TypeORM QueryBuilder 实例
   * @param conditions 查询条件数组
   * @returns QueryBuilder 实例（支持链式调用）
   *
   * @example
   * ```typescript
   * QueryBuilderHelper.applyConditions(qb, [
   *   { field: 'appType.typeName', value: typeName, operator: 'like' },
   *   { field: 'appType.typeCode', value: typeCode, operator: 'like' },
   *   { field: 'appType.typeStatus', value: typeStatus, operator: '=' },
   * ]);
   * ```
   */
  static applyConditions<T extends SelectQueryBuilder<any>>(
    qb: T,
    conditions: QueryCondition[],
  ): T {
    for (const condition of conditions) {
      // is_null / is_not_null 不需要检查 value
      if (
        condition.operator !== 'is_null' &&
        condition.operator !== 'is_not_null' &&
        (condition.value === undefined || condition.value === null)
      ) {
        continue;
      }

      const paramName = condition.paramName || condition.field.split('.').pop()!;
      const whereClause = this.buildWhereClause(condition);
      const parameters = this.buildParameters(condition);
      const logicalOp = condition.logicalOperator === 'OR' ? 'orWhere' : 'andWhere';

      qb[logicalOp](whereClause, parameters);
    }

    return qb;
  }

  /**
   * 应用高级查询条件（支持嵌套条件组）
   * @param qb TypeORM QueryBuilder 实例
   * @param group 条件组配置
   * @returns QueryBuilder 实例（支持链式调用）
   *
   * @example
   * ```typescript
   * // 场景：(status=1 OR status=2) AND (name LIKE '%test%' OR code LIKE '%test%')
   * QueryBuilderHelper.applyAdvancedConditions(qb, {
   *   logicalOperator: 'AND',
   *   conditions: [
   *     {
   *       logicalOperator: 'OR',
   *       conditions: [
   *         { field: 'user.status', value: 1, operator: '=' },
   *         { field: 'user.status', value: 2, operator: '=' },
   *       ],
   *     },
   *     {
   *       logicalOperator: 'OR',
   *       conditions: [
   *         { field: 'user.username', value: 'test', operator: 'like' },
   *         { field: 'user.nickName', value: 'test', operator: 'like' },
   *       ],
   *     },
   *   ],
   * });
   * ```
   */
  static applyAdvancedConditions<T extends SelectQueryBuilder<any>>(
    qb: T,
    group: ConditionGroup,
  ): T {
    const { logicalOperator, conditions } = group;

    // 类型守卫：判断是否为 ConditionGroup
    const isConditionGroup = (
      condition: QueryCondition | ConditionGroup,
    ): condition is ConditionGroup => {
      return 'conditions' in condition;
    };

    // 递归处理条件
    const processCondition = (
      condition: QueryCondition | ConditionGroup,
      parentOp: 'AND' | 'OR',
      isFirst: boolean,
      targetQb: SelectQueryBuilder<any>,
    ) => {
      if (isConditionGroup(condition)) {
        // 嵌套组
        const innerGroup = condition;
        const hasInnerConditions = innerGroup.conditions.some((c) => {
          if (isConditionGroup(c)) {
            return true;
          }
          if (c.operator === 'is_null' || c.operator === 'is_not_null') {
            return true;
          }
          return c.value !== undefined && c.value !== null;
        });

        if (!hasInnerConditions) return;

        if (isFirst) {
          // 第一个条件组使用 andWhere
          targetQb.andWhere((subQb) => {
            innerGroup.conditions.forEach((inner, idx) => {
              processCondition(inner, innerGroup.logicalOperator, idx === 0, subQb);
            });
          });
        } else {
          // 后续条件组需要嵌套
          const method = parentOp === 'OR' ? 'orWhere' : 'andWhere';
          targetQb[method]((subQb) => {
            innerGroup.conditions.forEach((inner, idx) => {
              processCondition(inner, innerGroup.logicalOperator, idx === 0, subQb);
            });
          });
        }
      } else {
        // 单个条件
        const queryCond = condition;
        if (
          queryCond.operator !== 'is_null' &&
          queryCond.operator !== 'is_not_null' &&
          (queryCond.value === undefined || queryCond.value === null)
        ) {
          return;
        }

        const whereClause = this.buildWhereClause(queryCond);
        const parameters = this.buildParameters(queryCond);

        if (isFirst) {
          targetQb.andWhere(whereClause, parameters);
        } else {
          const method = parentOp === 'OR' ? 'orWhere' : 'andWhere';
          targetQb[method](whereClause, parameters);
        }
      }
    };

    conditions.forEach((condition, index) => {
      processCondition(condition, logicalOperator, index === 0, qb);
    });

    return qb;
  }

  /**
   * 构建 WHERE 子句
   * @param condition 查询条件
   * @returns WHERE 子句字符串
   */
  private static buildWhereClause(condition: QueryCondition): string {
    const { field, operator = '=' } = condition;
    const paramName = condition.paramName || field.split('.').pop()!;

    switch (operator) {
      case 'like':
        return `${field} LIKE :${paramName}`;
      case 'like_left':
        return `${field} LIKE :${paramName}`;
      case 'like_right':
        return `${field} LIKE :${paramName}`;
      case '!=':
        return `${field} != :${paramName}`;
      case '>':
        return `${field} > :${paramName}`;
      case '<':
        return `${field} < :${paramName}`;
      case '>=':
        return `${field} >= :${paramName}`;
      case '<=':
        return `${field} <= :${paramName}`;
      case 'in':
        return `${field} IN (:...${paramName})`;
      case 'not_in':
        return `${field} NOT IN (:...${paramName})`;
      case 'between':
        return `${field} BETWEEN :${paramName}Start AND :${paramName}End`;
      case 'is_null':
        return `${field} IS NULL`;
      case 'is_not_null':
        return `${field} IS NOT NULL`;
      default:
        return `${field} = :${paramName}`;
    }
  }

  /**
   * 构建参数对象
   * @param condition 查询条件
   * @returns 参数对象
   */
  private static buildParameters(condition: QueryCondition): Record<string, any> {
    const { field, value, operator = '=' } = condition;
    const paramName = condition.paramName || field.split('.').pop()!;

    switch (operator) {
      case 'like':
        return { [paramName]: `%${value}%` };
      case 'like_left':
        return { [paramName]: `${value}%` };
      case 'like_right':
        return { [paramName]: `%${value}` };
      case 'in':
      case 'not_in':
        return { [paramName]: value };
      case 'between':
        // value 应该是 [start, end] 数组
        const [start, end] = value as [any, any];
        return { [`${paramName}Start`]: start, [`${paramName}End`]: end };
      case 'is_null':
      case 'is_not_null':
        return {};
      default:
        return { [paramName]: value };
    }
  }

  /**
   * 快捷方法：构建 LIKE 条件
   */
  static like(field: string, value?: string, paramName?: string): QueryCondition {
    return { field, value: value || '', operator: 'like', paramName };
  }

  /**
   * 快捷方法：构建等于条件
   */
  static eq(field: string, value?: any, paramName?: string): QueryCondition {
    return { field, value, operator: '=', paramName };
  }

  /**
   * 快捷方法：构建不等于条件
   */
  static ne(field: string, value?: any, paramName?: string): QueryCondition {
    return { field, value, operator: '!=', paramName };
  }

  /**
   * 快捷方法：构建大于条件
   */
  static gt(field: string, value?: number, paramName?: string): QueryCondition {
    return { field, value, operator: '>', paramName };
  }

  /**
   * 快捷方法：构建小于条件
   */
  static lt(field: string, value?: number, paramName?: string): QueryCondition {
    return { field, value, operator: '<', paramName };
  }

  /**
   * 快捷方法：构建 IN 条件
   */
  static in(field: string, value?: any[], paramName?: string): QueryCondition {
    return { field, value, operator: 'in', paramName };
  }

  /**
   * 快捷方法：构建 NOT IN 条件
   */
  static notIn(field: string, value?: any[], paramName?: string): QueryCondition {
    return { field, value, operator: 'not_in', paramName };
  }

  /**
   * 快捷方法：构建 >= 条件
   */
  static gte(field: string, value?: number | string, paramName?: string): QueryCondition {
    return { field, value, operator: '>=', paramName };
  }

  /**
   * 快捷方法：构建 <= 条件
   */
  static lte(field: string, value?: number | string, paramName?: string): QueryCondition {
    return { field, value, operator: '<=', paramName };
  }

  /**
   * 快捷方法：构建 BETWEEN 条件
   */
  static between(
    field: string,
    start?: number | string,
    end?: number | string,
    paramName?: string,
  ): QueryCondition {
    return { field, value: [start, end], operator: 'between', paramName };
  }

  /**
   * 快捷方法：构建 IS NULL 条件
   */
  static isNull(field: string, paramName?: string): QueryCondition {
    return { field, operator: 'is_null', paramName };
  }

  /**
   * 快捷方法：构建 IS NOT NULL 条件
   */
  static isNotNull(field: string, paramName?: string): QueryCondition {
    return { field, operator: 'is_not_null', paramName };
  }

  /**
   * 快捷方法：构建 LIKE LEFT 条件（以 x 开头）
   */
  static likeLeft(field: string, value?: string, paramName?: string): QueryCondition {
    return { field, value, operator: 'like_left', paramName };
  }

  /**
   * 快捷方法：构建 LIKE RIGHT 条件（以 x 结尾）
   */
  static likeRight(field: string, value?: string, paramName?: string): QueryCondition {
    return { field, value, operator: 'like_right', paramName };
  }

  /**
   * 快捷方法：构建 OR 条件
   */
  static or(condition: QueryCondition): QueryCondition {
    return { ...condition, logicalOperator: 'OR' };
  }
}

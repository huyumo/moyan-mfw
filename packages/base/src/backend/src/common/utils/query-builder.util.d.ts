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
    operator?: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'like' | 'like_left' | 'like_right' | 'in' | 'not_in' | 'between' | 'is_null' | 'is_not_null';
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
export declare class QueryBuilderHelper {
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
    static applyConditions<T extends SelectQueryBuilder<any>>(qb: T, conditions: QueryCondition[]): T;
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
    static applyAdvancedConditions<T extends SelectQueryBuilder<any>>(qb: T, group: ConditionGroup): T;
    /**
     * 构建 WHERE 子句
     * @param condition 查询条件
     * @returns WHERE 子句字符串
     */
    private static buildWhereClause;
    /**
     * 构建参数对象
     * @param condition 查询条件
     * @returns 参数对象
     */
    private static buildParameters;
    /**
     * 快捷方法：构建 LIKE 条件
     */
    static like(field: string, value?: string, paramName?: string): QueryCondition;
    /**
     * 快捷方法：构建等于条件
     */
    static eq(field: string, value?: any, paramName?: string): QueryCondition;
    /**
     * 快捷方法：构建不等于条件
     */
    static ne(field: string, value?: any, paramName?: string): QueryCondition;
    /**
     * 快捷方法：构建大于条件
     */
    static gt(field: string, value?: number, paramName?: string): QueryCondition;
    /**
     * 快捷方法：构建小于条件
     */
    static lt(field: string, value?: number, paramName?: string): QueryCondition;
    /**
     * 快捷方法：构建 IN 条件
     */
    static in(field: string, value?: any[], paramName?: string): QueryCondition;
    /**
     * 快捷方法：构建 NOT IN 条件
     */
    static notIn(field: string, value?: any[], paramName?: string): QueryCondition;
    /**
     * 快捷方法：构建 >= 条件
     */
    static gte(field: string, value?: number | string, paramName?: string): QueryCondition;
    /**
     * 快捷方法：构建 <= 条件
     */
    static lte(field: string, value?: number | string, paramName?: string): QueryCondition;
    /**
     * 快捷方法：构建 BETWEEN 条件
     */
    static between(field: string, start?: number | string, end?: number | string, paramName?: string): QueryCondition;
    /**
     * 快捷方法：构建 IS NULL 条件
     */
    static isNull(field: string, paramName?: string): QueryCondition;
    /**
     * 快捷方法：构建 IS NOT NULL 条件
     */
    static isNotNull(field: string, paramName?: string): QueryCondition;
    /**
     * 快捷方法：构建 LIKE LEFT 条件（以 x 开头）
     */
    static likeLeft(field: string, value?: string, paramName?: string): QueryCondition;
    /**
     * 快捷方法：构建 LIKE RIGHT 条件（以 x 结尾）
     */
    static likeRight(field: string, value?: string, paramName?: string): QueryCondition;
    /**
     * 快捷方法：构建 OR 条件
     */
    static or(condition: QueryCondition): QueryCondition;
}

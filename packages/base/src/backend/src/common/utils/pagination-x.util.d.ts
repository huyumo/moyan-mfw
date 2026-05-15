/**
 * @fileoverview 分页查询工具类（扩展版）
 * @description 提供基于原生 SQL 的分页查询功能，支持多 SQL 批量执行
 */
import { DataSource } from 'typeorm';
import { WhereBuilder } from './sql.util';
/**
 * SQL 数组项类型
 */
interface SqlArrayItem {
    tag: string;
    sql: string;
    params?: Record<string, any>;
    toData?: boolean;
    isGetOne?: boolean;
}
/**
 * SQL 生成函数参数类型
 */
interface SqlFunctionParams {
    select: string;
    limit: string;
    orderBy?: string;
    wheres?: Record<string, string>;
    [key: string]: any;
}
/**
 * 分页请求基础接口
 */
interface PagerReq {
    page: number;
    pageSize: number;
    sortField?: string;
    sortOrder?: 'ASC' | 'DESC';
}
/**
 * 分页查询参数 DTO
 */
export declare class PaginationQueryDto {
    page: number;
    pageSize: number;
    sortField?: string;
    sortOrder?: 'ASC' | 'DESC';
}
/**
 * 分页处理器
 */
export declare class PaginationX<T extends PagerReq> {
    static getConnection: (dbName: string) => DataSource;
    private query;
    private getSqlFunction;
    private selectSql;
    private pipeFunction;
    private orderByStr;
    private isPrintSql;
    private defaultOrderByStr;
    private noTotal;
    private sqls;
    private unshiftSqls;
    private pushSqls;
    private dbName;
    private results;
    private isExecuted;
    private whereBuilders;
    dataSource: DataSource;
    pageData: {
        list: Array<Record<string, any>>;
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        [key: string]: any;
    };
    /**
     * 分页构造器
     * @param dataSource - 数据源
     * @param query - 请求参数
     * @param noTotal - 是否不统计总数，默认要统计，true 为不统计
     */
    constructor(dataSource: DataSource, query: T, noTotal?: boolean);
    /**
     * 设置 select 字段
     * @param selectSql - 选择字段 SQL
     */
    select(selectSql: string): this;
    /**
     * 设置数据库连接别名，默认为 default
     * @param dbName - 数据库名称
     */
    setDbName(dbName: string): this;
    /**
     * 打印 SQL
     */
    printSql(): this;
    /**
     * 获取 SQL
     * @param sqlFunction - SQL 生成函数
     */
    sql(sqlFunction: (params: SqlFunctionParams) => string): this;
    /**
     * 设置 WHERE 条件构建器
     * @param name - WHERE 条件名称
     * @param whereBuilder - WHERE 条件构建器
     */
    where(name: string, whereBuilder: WhereBuilder): this;
    /**
     * 组装排序
     */
    private buildOrderBy;
    /**
     * 设置默认排序
     * @param order - 排序字段
     */
    defaultOrderBy(order: string): this;
    /**
     * 设置请求结果后，数据处理程序
     * @param pipeFunction - 数据处理函数
     */
    pipe(pipeFunction: (pager: PaginationX<T>) => Promise<unknown>): this;
    /**
     * 执行 SQL
     * @param isCount - 是否统计总数
     */
    private executeSql;
    /**
     * SQL SQL 数组的前面添加一条 SQL
     * @param options - SQL 配置选项
     */
    unshiftSql(options: {
        tag: string;
        sql: string | ((wheres: Record<string, string>) => string);
        whereBuilder?: WhereBuilder;
        toData?: boolean;
        isGetOne?: boolean;
    }): this;
    /**
     * SQL 数组的后面添加一条 SQL
     * @param options - SQL 配置选项
     */
    pushSql(options: {
        tag: string;
        sql: string | ((wheres: Record<string, string>) => string);
        whereBuilder?: WhereBuilder;
        toData?: boolean;
        isGetOne?: boolean;
    }): this;
    private runSql;
    /**
     * 获取分页结果
     * @param dataProcessor - 执行 SQL 后处理结果的方法
     * @param beforeProcessor - 执行 SQL 之前的中间件
     */
    getData(dataProcessor?: (result: unknown[], pager?: PaginationX<T>) => Promise<PaginationResult<T>>, beforeProcessor?: (sqls: Array<SqlArrayItem>) => Array<SqlArrayItem>): Promise<PaginationResult<T>>;
    /**
     * 获取执行结果
     * @param done - SQL 处理函数
     */
    private exec;
    /**
     * 根据 SQL 的 tag 获取查询结果
     * @param tag - SQL 标签
     * @param isGetOne - 是否获取单条数据
     */
    getResultByTag(tag: string, isGetOne?: boolean): any;
}
/**
 * 分页结果类
 */
export declare class PaginationResult<T> {
    list: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    [key: string]: any;
    constructor(list: T[], total: number, page: number, pageSize: number);
}
export {};
/**
 * @example
 * ```typescript
 * // 使用 WhereBuilder 进行分页查询（新版本）
 * import { PaginationX } from './pagination-x.util';
 * import { WhereBuilder } from './sql.util';
 *
 * // 构建查询条件
 * const whereBuilder = new WhereBuilder();
 * whereBuilder
 *   .eq('status', 'active')
 *   .gt('age', 18)
 *   .in('type', ['A', 'B']);
 *
 * // 创建分页查询
 * const pager = new PaginationX(dataSource, query);
 * pager
 *   .where('main', whereBuilder)
 *   .sql(({select, wheres, orderBy, limit}) => {
 *     return `SELECT ${select} FROM users ${wheres.main} ${orderBy} ${limit}`;
 *   });
 *
 * const result = await pager.getData();
 * // result: { list: [...], total: 100, page: 1, pageSize: 10, totalPages: 10 }
 * ```
 *
 * @example
 * ```typescript
 * // 多个 WHERE 条件
 * const mainWhere = new WhereBuilder();
 * mainWhere.eq('status', 'active');
 *
 * const roleWhere = new WhereBuilder();
 * roleWhere.eq('role', 'admin');
 *
 * const pager = new PaginationX(dataSource, query);
 * pager
 *   .where('main', mainWhere)
 *   .where('role', roleWhere)
 *   .sql(({select, wheres, orderBy, limit}) => {
 *     return `SELECT ${select} FROM users ${wheres.main} AND ${wheres.role} ${orderBy} ${limit}`;
 *   });
 *
 * const result = await pager.getData();
 * ```
 *
 * @example
 * ```typescript
 * // 使用 unshiftSql 和 pushSql 的回调函数
 * const whereBuilder = new WhereBuilder();
 * whereBuilder.eq('status', 'active');
 *
 * const pager = new PaginationX(dataSource, query);
 * pager
 *   .where('main', whereBuilder)
 *   .unshiftSql({ tag: 'init', sql: ({wheres}) => {
 *   // wheres 是 Record<string, string> 类型，包含已构建的 WHERE 子句
 *   // wheres.main = "WHERE status = :status_0"
 *     return `SET @status = 'active'`;
 *   }})
 *   .pushSql({ tag: 'cleanup', sql: ({wheres}) => {
 *     return `SET @status = NULL`;
 *   }})
 *   .sql(({select, wheres, orderBy, limit}) => {
 *     return `SELECT ${select} FROM users ${wheres.main} ${orderBy} ${limit}`;
 *   });
 *
 * const result = await pager.getData();
 * // result.pageData.init = [...]
 * // result.pageData.cleanup = [...]
 * ```
 *
 * @example
 * ```typescript
 * // 使用 unshiftSql 和 pushSql 的 WhereBuilder，并自动添加到 pageData
 * const mainWhere = new WhereBuilder();
 * mainWhere.eq('status', 'active');
 *
 * const extraWhere = new WhereBuilder();
 * extraWhere.eq('type', 'premium');
 *
 * const pager = new PaginationX(dataSource, query);
 * pager
 *   .where('main', mainWhere)
 *   .unshiftSql({ tag: 'init', sql: 'SET @status = "active"', toData: true })
 *   .pushSql({ tag: 'cleanup', sql: 'SET @status = NULL', toData: true })
 *   .sql(({select, wheres, orderBy, limit}) => {
 *     return `SELECT ${select} FROM users ${wheres.main} ${orderBy} ${limit}`;
 *   });
 *
 * const result = await pager.getData();
 * // result.pageData.init = [...]
 * // result.pageData.cleanup = [...]
 * ```
 *
 * @example
 * ```typescript
 * // 使用 unshiftSql 和 pushSql 获取单条数据
 * const pager = new PaginationX(dataSource, query);
 * pager
 *   .unshiftSql('init', 'SET @status = "active"')
 *   .pushSql({ tag: 'count', sql: 'SELECT COUNT(*) as count FROM users', toData: true, isGetOne: true })
 *   .sql(({select, wheres, orderBy, limit}) => {
 *     return `SELECT ${select} FROM users ${wheres.main} ${orderBy} ${limit}`;
 *   });
 *
 * const result = await pager.getData();
 * // result.pageData.count = { count: 100 }
 * ```
 *
 * @example
 * ```typescript
 * // 复杂条件分页查询
 * const subBuilder1 = new WhereBuilder();
 * subBuilder1
 *   .isNotNull('r.appTypeId')
 *   .isNotNull('a.id');
 *
 * const subBuilder2 = new WhereBuilder();
 * subBuilder2.eq('r.isBuiltin', 1);
 *
 * const outerBuilder = new WhereBuilder();
 * outerBuilder
 *   .group(subBuilder1)
 *   .group(subBuilder2, 'OR');
 *
 * const mainWhere = new WhereBuilder();
 * mainWhere
 *   .isNull('r.roleCode')
 *   .group(outerBuilder);
 *
 * const pager = new PaginationX(dataSource, query);
 * pager
 *   .where('main', mainWhere)
 *   .sql(({select, wheres, orderBy, limit}) => {
 *     return `SELECT ${select} FROM roles r LEFT JOIN apps a ON r.appTypeId = a.id ${wheres.main} ${orderBy} ${limit}`;
 *   });
 *
 * const result = await pager.getData();
 * ```
 *
 * @example
 * ```typescript
 * // 动态条件分页查询
 * const { status, age, type, keyword } = query;
 *
 * const whereBuilder = new WhereBuilder();
 * whereBuilder
 *   .eq('status', status)
 *   .gt('age', age)
 *   .in('type', type)
 *   .like('name', keyword);
 *
 * const pager = new PaginationX(dataSource, query);
 * pager
 *   .where('main', whereBuilder)
 *   .select('id, name, status, age')
 *   .defaultOrderBy('created DESC')
 *   .sql(({select, wheres, orderBy, limit}) => {
 *     return `SELECT ${select} FROM users ${wheres.main} ${orderBy} ${limit}`;
 *   });
 *
 * const result = await pager.getData();
 * ```
 */

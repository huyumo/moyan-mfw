"use strict";
/**
 * @fileoverview 分页查询工具类（扩展版）
 * @description 提供基于原生 SQL 的分页查询功能，支持多 SQL 批量执行
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationResult = exports.PaginationX = exports.PaginationQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const sql_util_1 = require("./sql.util");
/**
 * 分页查询参数 DTO
 */
class PaginationQueryDto {
    page = 1;
    pageSize = 10;
    sortField;
    sortOrder;
}
exports.PaginationQueryDto = PaginationQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页码', default: 1, example: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], PaginationQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '每页数量', default: 10, example: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], PaginationQueryDto.prototype, "pageSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序字段', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaginationQueryDto.prototype, "sortField", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序方向', required: false, enum: ['ASC', 'DESC'] }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PaginationQueryDto.prototype, "sortOrder", void 0);
/**
 * SQL 工具类
 */
class PaginationXUtils {
    /**
     * 格式化 SQL 语句
     * @param sql - SQL 语句
     * @returns 格式化后的 SQL 语句
     */
    static formatSql(sql) {
        return sql
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n');
    }
    /**
     * 构建排序 SQL
     */
    static ORDER_BY(query) {
        if (!query.sortField) {
            return '';
        }
        const sortOrder = query.sortOrder?.toUpperCase() || 'DESC';
        return `ORDER BY ${query.sortField} ${sortOrder}`;
    }
    /**
     * 分页选择处理器
     */
    static pagerSelectHandler(query, selectSql, isCount, orderByStr) {
        let processedSelectSql = selectSql;
        let limitSql = '';
        if (isCount) {
            processedSelectSql = 'COUNT(*) as count';
        }
        else {
            const offset = (Number(query.page) - 1) * Number(query.pageSize);
            limitSql = `LIMIT ${Number(query.pageSize)} OFFSET ${offset}`;
        }
        return {
            selectSql: processedSelectSql,
            limitSql,
            orderByStr: isCount ? '' : orderByStr,
        };
    }
}
/**
 * 分页处理器
 */
class PaginationX {
    static getConnection;
    query;
    getSqlFunction = () => '';
    selectSql = '*';
    pipeFunction;
    orderByStr = '';
    isPrintSql = false;
    defaultOrderByStr = '';
    noTotal = false;
    sqls = [];
    unshiftSqls = [];
    pushSqls = [];
    dbName = 'default';
    results = [];
    isExecuted = false;
    whereBuilders = {};
    dataSource;
    pageData = {
        list: [],
        total: 0,
        page: 0,
        pageSize: 0,
        totalPages: 0,
    };
    /**
     * 分页构造器
     * @param dataSource - 数据源
     * @param query - 请求参数
     * @param noTotal - 是否不统计总数，默认要统计，true 为不统计
     */
    constructor(dataSource, query, noTotal = false) {
        this.dataSource = dataSource;
        this.noTotal = noTotal;
        this.query = query;
        this.buildOrderBy();
    }
    /**
     * 设置 select 字段
     * @param selectSql - 选择字段 SQL
     */
    select(selectSql) {
        this.selectSql = selectSql;
        return this;
    }
    /**
     * 设置数据库连接别名，默认为 default
     * @param dbName - 数据库名称
     */
    setDbName(dbName) {
        this.dbName = dbName;
        return this;
    }
    /**
     * 打印 SQL
     */
    printSql() {
        this.isPrintSql = true;
        return this;
    }
    /**
     * 获取 SQL
     * @param sqlFunction - SQL 生成函数
     */
    sql(sqlFunction) {
        this.getSqlFunction = sqlFunction;
        return this;
    }
    /**
     * 设置 WHERE 条件构建器
     * @param name - WHERE 条件名称
     * @param whereBuilder - WHERE 条件构建器
     */
    where(name, whereBuilder) {
        this.whereBuilders[name] = whereBuilder;
        return this;
    }
    /**
     * 组装排序
     */
    buildOrderBy() {
        this.orderByStr = PaginationXUtils.ORDER_BY(this.query);
    }
    /**
     * 设置默认排序
     * @param order - 排序字段
     */
    defaultOrderBy(order) {
        this.defaultOrderByStr = `ORDER BY ${order}`;
        return this;
    }
    /**
     * 设置请求结果后，数据处理程序
     * @param pipeFunction - 数据处理函数
     */
    pipe(pipeFunction) {
        this.pipeFunction = pipeFunction;
        return this;
    }
    /**
     * 执行 SQL
     * @param isCount - 是否统计总数
     */
    async executeSql(isCount = false) {
        const { selectSql, limitSql, orderByStr } = PaginationXUtils.pagerSelectHandler(this.query, this.selectSql, isCount, this.orderByStr || this.defaultOrderByStr);
        const wheres = {};
        const allParams = {};
        for (const [name, builder] of Object.entries(this.whereBuilders)) {
            const { where, params } = builder.build();
            if (where) {
                wheres[name] = where;
            }
            Object.assign(allParams, params);
        }
        const sqlParams = {
            select: selectSql,
            limit: limitSql,
            orderBy: orderByStr,
            wheres,
            ...allParams,
        };
        let sql = this.getSqlFunction(sqlParams);
        let tag = 'rows';
        if (isCount === true) {
            tag = 'total';
        }
        this.sqls.push({ tag, sql: sql.replace(';', ''), params: allParams });
    }
    /**
     * SQL SQL 数组的前面添加一条 SQL
     * @param options - SQL 配置选项
     */
    unshiftSql(options) {
        let processedSql;
        let params = {};
        if (typeof options.sql === 'function') {
            const wheres = {};
            for (const [name, builder] of Object.entries(this.whereBuilders)) {
                const { where } = builder.build();
                if (where) {
                    wheres[name] = where;
                }
            }
            processedSql = options.sql(wheres);
        }
        else {
            processedSql = options.sql;
        }
        if (options.whereBuilder) {
            const { where, params: whereParams } = options.whereBuilder.build();
            processedSql = processedSql.replace(/\{where\}/g, where);
            params = whereParams;
        }
        this.unshiftSqls.unshift({ tag: options.tag, sql: processedSql.replace(';', ''), params, toData: options.toData, isGetOne: options.isGetOne });
        return this;
    }
    /**
     * SQL 数组的后面添加一条 SQL
     * @param options - SQL 配置选项
     */
    pushSql(options) {
        let processedSql;
        let params = {};
        if (typeof options.sql === 'function') {
            const wheres = {};
            for (const [name, builder] of Object.entries(this.whereBuilders)) {
                const { where } = builder.build();
                if (where) {
                    wheres[name] = where;
                }
            }
            processedSql = options.sql(wheres);
        }
        else {
            processedSql = options.sql;
        }
        if (options.whereBuilder) {
            const { where, params: whereParams } = options.whereBuilder.build();
            processedSql = processedSql.replace(/\{where\}/g, where);
            params = whereParams;
        }
        this.unshiftSqls.push({ tag: options.tag, sql: processedSql.replace(';', ''), params, toData: options.toData, isGetOne: options.isGetOne });
        return this;
    }
    async runSql(done) {
        await this.executeSql(false);
        if (!this.noTotal) {
            await this.executeSql(true);
        }
        this.sqls.unshift(...this.unshiftSqls);
        this.sqls.push(...this.pushSqls);
        if (done) {
            this.sqls = done(this.sqls);
        }
        if (this.isPrintSql) {
            const formattedSqls = this.sqls.map((item) => {
                let sql = item.sql;
                if (item.params) {
                    for (const [key, value] of Object.entries(item.params)) {
                        const placeholder = `:${key}`;
                        let replacement;
                        if (typeof value === 'string') {
                            replacement = `'${value.replace(/'/g, "''")}'`;
                        }
                        else if (typeof value === 'bigint') {
                            replacement = value.toString();
                        }
                        else if (typeof value === 'number') {
                            replacement = value.toString();
                        }
                        else if (value === null) {
                            replacement = 'NULL';
                        }
                        else {
                            replacement = String(value);
                        }
                        sql = sql.replace(new RegExp(placeholder, 'g'), replacement);
                    }
                }
                return PaginationXUtils.formatSql(sql);
            });
            const sql = formattedSqls.join(';\n') + ';';
            console.log('=== SQL DEBUG ===');
            console.log(sql);
            console.log('=== SQL END ===');
        }
        const results = [];
        for (const sqlItem of this.sqls) {
            const params = sqlItem.params || {};
            const result = await (0, sql_util_1.executeRawSql)(this.dataSource, sqlItem.sql, params);
            results.push(result);
        }
        this.results = results;
        this.isExecuted = true;
    }
    /**
     * 获取分页结果
     * @param dataProcessor - 执行 SQL 后处理结果的方法
     * @param beforeProcessor - 执行 SQL 之前的中间件
     */
    async getData(dataProcessor, beforeProcessor) {
        await this.runSql(beforeProcessor);
        const totalResult = this.getResultByTag('total', true);
        const rows = this.getResultByTag('rows') || [];
        const page = Number(this.query.page);
        const pageSize = Number(this.query.pageSize);
        const total = totalResult ? Number(totalResult.count) : 0;
        const totalPages = Math.ceil(total / pageSize);
        this.pageData = {
            list: rows,
            total,
            page,
            pageSize,
            totalPages,
        };
        for (const sqlItem of this.sqls) {
            if (sqlItem.toData && sqlItem.sql.toUpperCase().startsWith('SELECT')) {
                const result = this.getResultByTag(sqlItem.tag, sqlItem.isGetOne);
                this.pageData[sqlItem.tag] = result;
            }
        }
        this.pipeFunction && (await this.pipeFunction(this, this.results));
        if (dataProcessor) {
            return await dataProcessor(this.pageData.list, this);
        }
        return new PaginationResult(this.pageData.list, this.pageData.total, this.pageData.page, this.pageData.pageSize);
    }
    /**
     * 获取执行结果
     * @param done - SQL 处理函数
     */
    async exec(done) {
        await this.runSql(done);
        return this;
    }
    /**
     * 根据 SQL 的 tag 获取查询结果
     * @param tag - SQL 标签
     * @param isGetOne - 是否获取单条数据
     */
    getResultByTag(tag, isGetOne = false) {
        if (this.isExecuted) {
            const index = this.sqls.findIndex((item) => item.tag === tag);
            if (this.sqls.length === 1 && index >= 0) {
                return isGetOne ? this.results[0] : this.results;
            }
            const result = this.results[index];
            if (result) {
                return isGetOne ? result[0] : result;
            }
            return null;
        }
        return null;
    }
}
exports.PaginationX = PaginationX;
/**
 * 分页结果类
 */
class PaginationResult {
    list;
    total;
    page;
    pageSize;
    totalPages;
    constructor(list, total, page, pageSize) {
        this.list = list;
        this.total = total;
        this.page = page;
        this.pageSize = pageSize;
        this.totalPages = Math.ceil(total / pageSize);
    }
}
exports.PaginationResult = PaginationResult;
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
//# sourceMappingURL=pagination-x.util.js.map
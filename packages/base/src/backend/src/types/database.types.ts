/**
 * @fileoverview 数据库配置类型定义
 * @description MySQL / TypeORM 数据库连接配置，支持连接池与原生 mysql2 选项透传。
 *
 * 配置合并优先级：用户 `extra` > 用户类型化字段 > 框架默认值。
 * 未传入的字段回退到框架默认行为，保持向后兼容。
 */

/**
 * 数据库配置
 *
 * @example 基础用法
 * ```ts
 * createBaseBackendApp({
 *   database: { host: '127.0.0.1', port: 3306, poolSize: 50 }
 * })
 * ```
 *
 * @example 连接池调优
 * ```ts
 * createBaseBackendApp({
 *   database: {
 *     poolSize: 100,
 *     connectionLimit: 100,
 *     waitForConnections: true,
 *     queueLimit: 1000,
 *     enableKeepAlive: true,
 *     keepAliveInitialDelay: 10000,
 *     connectTimeout: 10000,
 *   }
 * })
 * ```
 *
 * @example 透传原生 mysql2 选项（优先级最高，可覆盖以上所有）
 * ```ts
 * createBaseBackendApp({
 *   database: {
 *     extra: { ssl: { rejectUnauthorized: true }, decimalNumbers: true }
 *   }
 * })
 * ```
 */
export interface DatabaseConfig {
  /** 数据库主机 */
  host?: string;
  /** 数据库端口 */
  port?: number;
  /** 数据库用户名 */
  username?: string;
  /** 数据库密码 */
  password?: string;
  /** 数据库名称 */
  database?: string;
  /** 字符集，默认 utf8mb4 */
  charset?: string;
  /** 时区，默认 +08:00 */
  timezone?: string;
  /** 连接池大小，默认 100 */
  poolSize?: number;
  /** 是否自动同步 schema（生产环境应关闭） */
  synchronize?: boolean;
  /** 是否开启 SQL 日志 */
  logging?: boolean;

  // —— 连接池 / 连接行为类型化字段（透传至 TypeORM extra）——

  /** mysql2 连接池上限，未设置时不写入（由 mysql2 默认行为决定） */
  connectionLimit?: number;
  /** 连接耗尽时是否排队等待 */
  waitForConnections?: boolean;
  /** 排队上限，0 表示无限 */
  queueLimit?: number;
  /** 连接保活，防止 wait_timeout 断连 */
  enableKeepAlive?: boolean;
  /** 保活心跳初始延迟（ms） */
  keepAliveInitialDelay?: number;
  /** 建立连接超时（ms） */
  connectTimeout?: number;
  /** 是否允许多语句执行，默认 true */
  multipleStatements?: boolean;

  /**
   * 透传给 TypeORM `extra` 的原生 mysql2 选项。
   * 优先级最高，可覆盖以上所有类型化字段。
   * 适合传入 ssl、decimalNumbers 等未单独建模的选项。
   */
  extra?: Record<string, any>;
}

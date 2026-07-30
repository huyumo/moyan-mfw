/**
 * @fileoverview Redis 配置类型定义
 * @description node-redis v4 连接配置，支持连接行为与原生选项透传。
 *
 * 配置合并优先级：用户 `extra` > 用户类型化字段 > 环境变量 > 框架默认值。
 * 未传入的字段回退到 `process.env` 与原硬编码默认，保持向后兼容。
 */

/**
 * Redis 配置
 *
 * @example 基础用法
 * ```ts
 * createBaseBackendApp({
 *   redis: { host: '127.0.0.1', port: 6379, password: 'xxx' }
 * })
 * ```
 *
 * @example 连接行为调优
 * ```ts
 * createBaseBackendApp({
 *   redis: {
 *     connectTimeout: 10000,
 *     maxRetriesPerRequest: 5,
 *     keyPrefix: 'mfw:',
 *   }
 * })
 * ```
 *
 * @example 透传原生 node-redis 选项（优先级最高）
 * ```ts
 * createBaseBackendApp({
 *   redis: {
 *     extra: { socket: { tls: true, keepAlive: 30000 } }
 *   }
 * })
 * ```
 */
export interface RedisConfig {
  /** Redis 主机，默认回退 REDIS_HOST / localhost */
  host?: string;
  /** Redis 端口，默认回退 REDIS_PORT / 6379 */
  port?: number;
  /** Redis 密码，默认回退 REDIS_PASSWORD */
  password?: string;
  /** Redis db 序号，默认回退 REDIS_DB / 0 */
  db?: number;

  // —— 连接行为类型化字段 ——
  /** 建立连接超时（ms），默认 5000 */
  connectTimeout?: number;
  /** 最大重连次数，默认 10 */
  maxRetriesPerRequest?: number;
  /** key 前缀 */
  keyPrefix?: string;

  /**
   * 透传给 node-redis `createClient` 的原生选项。
   * 优先级最高，可覆盖以上所有类型化字段。
   * 适合传入 socket.tls、isolationPoolOptions 等未单独建模的选项。
   */
  extra?: Record<string, any>;
}

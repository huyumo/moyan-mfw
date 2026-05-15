"use strict";
/**
 * @fileoverview Redis 配置
 * @description Redis 连接配置，用于缓存和会话存储
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    /**
     * Redis 主机
     * @type {string}
     * @default 'localhost'
     */
    host: process.env.REDIS_HOST || 'localhost',
    /**
     * Redis 端口
     * @type {number}
     * @default 6379
     */
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    /**
     * Redis 密码
     * @type {string}
     * @default ''
     */
    password: process.env.REDIS_PASSWORD || '',
    /**
     * Redis 数据库
     * @type {number}
     * @default 0
     */
    db: parseInt(process.env.REDIS_DB || '0', 10),
    /**
     * 键前缀
     * @type {string}
     */
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'mfw:',
    /**
     * 默认 TTL（秒）
     * @type {number}
     * @default 1800 (30 分钟)
     */
    defaultTTL: parseInt(process.env.REDIS_DEFAULT_TTL || '1800', 10),
});
//# sourceMappingURL=redis.config.js.map
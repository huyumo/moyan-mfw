/**
 * @fileoverview Redis 配置
 * @description Redis 连接配置，用于缓存和会话存储
 */
declare const _default: () => {
    /**
     * Redis 主机
     * @type {string}
     * @default 'localhost'
     */
    host: string;
    /**
     * Redis 端口
     * @type {number}
     * @default 6379
     */
    port: number;
    /**
     * Redis 密码
     * @type {string}
     * @default ''
     */
    password: string;
    /**
     * Redis 数据库
     * @type {number}
     * @default 0
     */
    db: number;
    /**
     * 键前缀
     * @type {string}
     */
    keyPrefix: string;
    /**
     * 默认 TTL（秒）
     * @type {number}
     * @default 1800 (30 分钟)
     */
    defaultTTL: number;
};
export default _default;

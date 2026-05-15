/**
 * @fileoverview 应用配置
 * @description 应用基础配置，包括端口、环境等
 */
declare const _default: () => {
    /**
     * 应用端口
     * @type {number}
     * @default 3000
     */
    port: number;
    /**
     * 应用环境
     * @type {string}
     * @default 'development'
     */
    env: string;
    /**
     * 应用名称
     * @type {string}
     */
    name: string;
    /**
     * 应用版本
     * @type {string}
     */
    version: string;
    /**
     * CORS 配置
     */
    cors: {
        /**
         * 允许的源
         * @type {string}
         * @default '*'
         */
        origin: string;
        /**
         * 是否允许携带凭证
         * @type {boolean}
         * @default true
         */
        credentials: boolean;
        /**
         * 允许的方法
         * @type {string[]}
         */
        methods: string[];
        /**
         * 允许的 headers
         * @type {string[]}
         */
        allowedHeaders: string[];
    };
    /**
     * 全局前缀
     * @type {string}
     * @default '/api'
     */
    globalPrefix: string;
    /**
     * JWT 配置
     */
    jwt: {
        /**
         * JWT 密钥
         * @type {string}
         */
        secret: string;
        /**
         * Token 过期时间
         * @type {string}
         * @default '24h'
         */
        expiresIn: string;
        /**
         * 刷新 Token 过期时间
         * @type {string}
         * @default '7d'
         */
        refreshExpiresIn: string;
    };
};
export default _default;

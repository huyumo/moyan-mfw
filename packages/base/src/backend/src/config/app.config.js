"use strict";
/**
 * @fileoverview 应用配置
 * @description 应用基础配置，包括端口、环境等
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    /**
     * 应用端口
     * @type {number}
     * @default 3000
     */
    port: parseInt(process.env.PORT || '3000', 10),
    /**
     * 应用环境
     * @type {string}
     * @default 'development'
     */
    env: process.env.NODE_ENV || 'development',
    /**
     * 应用名称
     * @type {string}
     */
    name: process.env.APP_NAME || 'Moyan MFW Backend',
    /**
     * 应用版本
     * @type {string}
     */
    version: process.env.APP_VERSION || '1.0.0',
    /**
     * CORS 配置
     */
    cors: {
        /**
         * 允许的源
         * @type {string}
         * @default '*'
         */
        origin: process.env.CORS_ORIGIN || '*',
        /**
         * 是否允许携带凭证
         * @type {boolean}
         * @default true
         */
        credentials: true,
        /**
         * 允许的方法
         * @type {string[]}
         */
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        /**
         * 允许的 headers
         * @type {string[]}
         */
        allowedHeaders: ['Content-Type', 'Authorization', 'X-App-Type-Code'],
    },
    /**
     * 全局前缀
     * @type {string}
     * @default '/api'
     */
    globalPrefix: process.env.API_PREFIX || '/api',
    /**
     * JWT 配置
     */
    jwt: {
        /**
         * JWT 密钥
         * @type {string}
         */
        secret: process.env.JWT_SECRET || 'default-secret',
        /**
         * Token 过期时间
         * @type {string}
         * @default '24h'
         */
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        /**
         * 刷新 Token 过期时间
         * @type {string}
         * @default '7d'
         */
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
});
//# sourceMappingURL=app.config.js.map
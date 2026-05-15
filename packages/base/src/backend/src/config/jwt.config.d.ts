/**
 * @fileoverview JWT 配置
 * @description JWT Token 签发和验证相关配置
 */
declare const _default: () => {
    /**
     * JWT 配置
     */
    jwt: {
        /**
         * Access Token 过期时间（秒）
         * @type {number}
         * @default 7200 (2 小时)
         */
        expiresIn: number;
        /**
         * Refresh Token 过期时间（秒）
         * @type {number}
         * @default 7200 (2 小时)
         */
        refreshExpiresIn: number;
        /**
         * JWT 签名密钥
         * @type {string}
         */
        secret: string;
    };
};
export default _default;

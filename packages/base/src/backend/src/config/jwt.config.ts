/**
 * @fileoverview JWT 配置
 * @description JWT Token 签发和验证相关配置
 */

export default () => ({
  /**
   * JWT 配置
   */
  jwt: {
    /**
     * Access Token 过期时间（秒）
     * @type {number}
     * @default 7200 (2 小时)
     */
    expiresIn: process.env.JWT_EXPIRES_IN || '7200',

    /**
     * Refresh Token 过期时间（秒）
     * @type {number}
     * @default 7200 (2 小时)
     */
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '7200',

    /**
     * JWT 签名密钥
     * @type {string}
     */
    secret: process.env.JWT_SECRET || '',
  },
});

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
     * Access Token 过期时间
     * 支持 jwt 库能识别的所有格式：数字（秒）、'24h'、'30s'、'7d' 等
     * @type {number | string}
     * @default 7200 (2 小时)
     */
    expiresIn: process.env.JWT_EXPIRES_IN || 7200,

    /**
     * Refresh Token 过期时间
     * @type {number | string}
     * @default 7200 (2 小时)
     */
    refreshExpiresIn:
      process.env.JWT_REFRESH_EXPIRES_IN ||
      process.env.JWT_EXPIRES_IN ||
      7200,

    /**
     * JWT 签名密钥
     * @type {string}
     */
    secret: process.env.JWT_SECRET || '',
  },
});

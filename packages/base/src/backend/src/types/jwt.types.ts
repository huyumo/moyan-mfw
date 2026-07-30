/**
 * @fileoverview JWT 配置类型定义
 * @description JWT 签发与验证配置，支持 refreshExpiresIn 与原生 signOptions 透传。
 *
 * 配置合并优先级：用户 `signOptions` > 用户类型化字段 > 环境变量 > 框架默认值。
 * 未传入的字段回退到 `process.env` 与原默认，保持向后兼容。
 */

/**
 * JWT 配置
 *
 * @example 基础用法
 * ```ts
 * createBaseBackendApp({
 *   jwt: { secret: 'my-secret', expiresIn: 7200, refreshExpiresIn: 604800 }
 * })
 * ```
 *
 * @example 透传原生 signOptions（优先级最高，可覆盖 expiresIn）
 * ```ts
 * createBaseBackendApp({
 *   jwt: {
 *     secret: 'my-secret',
 *     signOptions: { algorithm: 'HS512', issuer: 'mfw', audience: 'app' }
 *   }
 * })
 * ```
 */
export interface JwtConfig {
  /** JWT 签名密钥，默认回退 JWT_SECRET */
  secret?: string;
  /** Access Token 过期时间（秒或时间字符串），默认 7200 */
  expiresIn?: string | number;
  /** Refresh Token 过期时间（秒或时间字符串），默认回退 JWT_REFRESH_EXPIRES_IN / JWT_EXPIRES_IN / 7200 */
  refreshExpiresIn?: string | number;

  /**
   * 透传给 JwtModule `signOptions` 的原生选项。
   * 优先级最高，可覆盖 expiresIn（algorithm/issuer/audience 等）。
   */
  signOptions?: Record<string, any>;
}

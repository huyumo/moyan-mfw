/**
 * @fileoverview 加密工具函数
 * @description 提供密码加密、验证等加密相关功能
 */
/**
 * 密码加密
 * @param password - 明文密码
 * @returns 加密后的密码哈希
 *
 * @example
 * ```typescript
 * const hash = await hashPassword('123456');
 * ```
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * 密码验证
 * @param password - 明文密码
 * @param hash - 加密后的密码哈希
 * @returns 是否匹配
 *
 * @example
 * ```typescript
 * const isValid = await verifyPassword('123456', hash);
 * ```
 */
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;

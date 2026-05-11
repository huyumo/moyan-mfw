/**
 * @fileoverview 加密工具函数
 * @description 提供密码加密、验证等加密相关功能
 */

import * as bcrypt from 'bcrypt';

/**
 * 默认盐值 rounds
 * @description bcrypt 加密的盐值 rounds，值越大越安全但越慢
 */
const SALT_ROUNDS = 10;

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
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

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
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

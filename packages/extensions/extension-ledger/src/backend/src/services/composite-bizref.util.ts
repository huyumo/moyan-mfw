/**
 * @fileoverview 组合幂等键工具
 * @description 多维度业务幂等键（如 订单+受益方+层级）MD5 摘要为 32 位 hex，适配 bizRef varchar(64)
 */

import { createHash } from 'node:crypto'

/**
 * 组合幂等键：parts 以 ':' 连接后 MD5 摘要（32 位 hex）
 * 调用方须保证拼接内容稳定有序；null/undefined 按空串处理
 * @example buildCompositeBizRef(['order-1', 'm', 'm-88', 'referrer-1']) === 'd41d8cd9...'
 */
export function buildCompositeBizRef(parts: (string | number | undefined | null)[]): string {
  const joined = parts.map((p) => (p === undefined || p === null ? '' : String(p))).join(':')
  return createHash('md5').update(joined, 'utf8').digest('hex')
}

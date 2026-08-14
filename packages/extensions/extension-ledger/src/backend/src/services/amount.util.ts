/**
 * @fileoverview 金额处理工具
 * @description bigint 最小单位字符串处理；JS Number 精度丢失防护（>2^53）
 */

/** 单笔金额上限（1e15 最小单位） */
export const MAX_AMOUNT = '1000000000000000'

/**
 * 解析金额字符串为 bigint
 * @throws 非法金额（非整数、负数、零、超上限）
 */
export function parseAmount(raw: string | number, field = 'amount'): bigint {
  const str = String(raw).trim()
  if (!/^-?\d+$/.test(str)) {
    throw new Error(`非法金额[${field}]：${str}（须为整数）`)
  }
  const val = BigInt(str)
  if (val <= 0n) {
    throw new Error(`非法金额[${field}]：${str}（须为正整数，负数或零禁止）`)
  }
  if (val > BigInt(MAX_AMOUNT)) {
    throw new Error(`金额超上限[${field}]：${str}（最大 ${MAX_AMOUNT}）`)
  }
  return val
}

/** 金额转字符串 */
export function amountToString(val: bigint | string | number): string {
  if (typeof val === 'bigint') return val.toString()
  return String(val)
}

/** bigint 加法（字符串入参） */
export function add(a: string, b: string): string {
  return (BigInt(a) + BigInt(b)).toString()
}

/** bigint 减法（字符串入参） */
export function sub(a: string, b: string): string {
  return (BigInt(a) - BigInt(b)).toString()
}

/** bigint 比较：a > b 返回 1，相等 0，a < b 返回 -1 */
export function compare(a: string, b: string): number {
  const diff = BigInt(a) - BigInt(b)
  if (diff > 0n) return 1
  if (diff < 0n) return -1
  return 0
}

/** 是否足够（a >= b） */
export function gte(a: string, b: string): boolean {
  return BigInt(a) >= BigInt(b)
}

/**
 * @fileoverview 借贷记账扩展包共享工具
 * @description 纯函数工具（无 Node 依赖，前后端可用）；金额展示换算
 */

import type { AmountString } from './types'

/**
 * 最小单位金额 → 元展示（2 位小数）
 * BigInt 除 100 避免浮点误差（0.1+0.2 类问题）；负数保留符号
 * @example amountToYuan('123456') === '1234.56'
 */
export function amountToYuan(amount: AmountString | number | bigint): string {
  const val = BigInt(String(amount))
  const sign = val < 0n ? '-' : ''
  const abs = val < 0n ? -val : val
  const yuan = abs / 100n
  const cents = abs % 100n
  return `${sign}${yuan}.${cents.toString().padStart(2, '0')}`
}

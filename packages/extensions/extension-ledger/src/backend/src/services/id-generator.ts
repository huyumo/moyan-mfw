/**
 * @fileoverview 单号生成器
 * @description 不引入新依赖，用 node:crypto 生成日期前缀 + 随机 hex 的单号
 */

import { randomBytes } from 'node:crypto'

/** 生成交易单号：T + yyyyMMdd + 16位随机 hex（共 25 字符） */
export function generateTransferNo(): string {
  const d = new Date()
  const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  const rand = randomBytes(8).toString('hex').toUpperCase()
  return `T${date}${rand}`
}

/** 生成冲正单号：R + yyyyMMdd + 16位随机 hex（共 25 字符） */
export function generateReversalNo(): string {
  const d = new Date()
  const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  const rand = randomBytes(8).toString('hex').toUpperCase()
  return `R${date}${rand}`
}

/** 生成分录单号：transferNo + -D{n} / -C{n}（借/贷 + 序号） */
export function generateEntryNo(transferNo: string, direction: number, seq: number): string {
  const prefix = direction === 1 ? 'D' : 'C'
  return `${transferNo}-${prefix}${seq}`
}

/** 生成认领令牌：executorId:uuid（带实例前缀，优雅停机按前缀释放） */
export function generateClaimToken(executorId: string): string {
  return `${executorId}:${randomBytes(16).toString('hex')}`
}

/** 生成 executorId：hostname-pid-randomHex（多实例消费者标识） */
export function generateExecutorId(): string {
  const os = require('node:os')
  const hostname = os.hostname()
  const pid = process.pid
  const rand = randomBytes(4).toString('hex')
  return `${hostname}-${pid}-${rand}`
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

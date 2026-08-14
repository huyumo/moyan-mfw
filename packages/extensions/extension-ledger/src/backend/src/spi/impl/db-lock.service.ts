/**
 * @fileoverview DbLock - ILedgerLock 默认实现（MySQL GET_LOCK）
 * @description 评审 A4🔴2：scheduler 的 DbLock 是 no-op 占位（互斥靠业务 CAS），ledger 无此 CAS，
 *   必须实现真正的锁。MySQL GET_LOCK 是**会话（连接）级**命名锁：
 *   - GET_LOCK 与 RELEASE_LOCK 必须在**同一连接**上执行
 *   - 本实现使用单常驻专用连接（懒连接），所有锁操作共用
 *   - 连接断开时 MySQL 自动释放锁（含进程崩溃兜底）
 *
 * 局限：单连接串行化锁操作；高并发多实例场景建议换 RedisLock（SET NX EX）
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { DataSource, QueryRunner } from 'typeorm'
import { randomBytes } from 'node:crypto'
import type { ILedgerLock } from '../interfaces'

@Injectable()
export class DbLock implements ILedgerLock, OnModuleDestroy {
  private readonly logger = new Logger(DbLock.name)
  /** 活跃锁记录（resource -> { token, timer }），用于 ttl 主动释放 */
  private readonly active = new Map<string, { token: string; timer: NodeJS.Timeout }>()
  /** 单常驻专用连接（GET_LOCK/RELEASE_LOCK 同连接才能释放） */
  private conn: QueryRunner | null = null
  private connReady: Promise<QueryRunner> | null = null

  constructor(private readonly dataSource: DataSource) {}

  /** 获取/初始化常驻连接 */
  private getConn(): Promise<QueryRunner> {
    if (this.conn) return Promise.resolve(this.conn)
    if (!this.connReady) {
      this.connReady = (async () => {
        const qr = this.dataSource.createQueryRunner()
        await qr.connect()
        this.conn = qr
        return qr
      })()
    }
    return this.connReady
  }

  async tryLock(resource: string, ttlSeconds: number): Promise<string | null> {
    // 单实例内先互斥（防同进程重复加锁）
    if (this.active.has(resource)) return null
    const token = randomBytes(16).toString('hex')

    let conn: QueryRunner
    try {
      conn = await this.getConn()
    } catch (err: any) {
      this.logger.warn(`DbLock 连接失败（降级返回 null）: ${err?.message}`)
      return null
    }

    try {
      // GET_LOCK：返回 1=成功，0=超时，NULL=错误
      const result: any = await conn.query(`SELECT GET_LOCK(?, ?) AS ok`, [`mfw_ledger:${resource}`, ttlSeconds])
      const ok = Number(result?.[0]?.ok ?? 0)
      if (ok !== 1) return null

      // ttl 到期主动释放（同连接）
      const timer = setTimeout(() => {
        this.active.delete(resource)
        conn.query(`SELECT RELEASE_LOCK(?)`, [`mfw_ledger:${resource}`]).catch(() => {})
      }, ttlSeconds * 1000)
      this.active.set(resource, { token, timer })
      return token
    } catch (err: any) {
      this.logger.warn(`DbLock GET_LOCK 异常: ${err?.message}`)
      return null
    }
  }

  async unlock(resource: string, token: string): Promise<boolean> {
    const entry = this.active.get(resource)
    if (!entry || entry.token !== token) return false
    clearTimeout(entry.timer)
    this.active.delete(resource)
    if (!this.conn) return false
    try {
      // 同一常驻连接上释放
      const result: any = await this.conn.query(`SELECT RELEASE_LOCK(?) AS ok`, [`mfw_ledger:${resource}`])
      return Number(result?.[0]?.ok ?? 0) === 1
    } catch (err: any) {
      this.logger.warn(`DbLock RELEASE_LOCK 异常: ${err?.message}`)
      return false
    }
  }

  async onModuleDestroy(): Promise<void> {
    // 释放全部活跃锁 + 关闭常驻连接（连接关闭自动释放会话锁）
    for (const [resource, entry] of this.active) {
      clearTimeout(entry.timer)
      this.active.delete(resource)
    }
    if (this.conn) {
      try {
        await this.conn.release()
      } catch {
        // 忽略关闭异常
      }
      this.conn = null
    }
  }
}

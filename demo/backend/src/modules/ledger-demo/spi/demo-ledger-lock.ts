/**
 * @fileoverview 账本分布式锁 SPI 演示实现（ILedgerLock 包装替换）
 * @description 包装默认 DbLock（MySQL GET_LOCK）增加统计计数，展示 lockImpl 替换位写法。
 *
 * 多实例高并发场景可换包内置 RedisLock（SET NX EX，需 base CACHE_DRIVER=redis）：
 *   lockImpl: RedisLock
 */

import { Injectable, Logger } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { DbLock, type ILedgerLock } from 'moyan-mfw-extension-ledger/backend'

@Injectable()
export class DemoLedgerLock implements ILedgerLock {
  private readonly logger = new Logger(DemoLedgerLock.name)
  private readonly inner: DbLock

  /** 锁统计（供用例查询） */
  lockAcquired = 0
  lockFailed = 0
  lockReleased = 0

  constructor(dataSource: DataSource) {
    this.inner = new DbLock(dataSource)
  }

  async tryLock(resource: string, ttlSeconds: number): Promise<string | null> {
    const token = await this.inner.tryLock(resource, ttlSeconds)
    if (token) {
      this.lockAcquired += 1
      this.logger.log(`[锁SPI] tryLock 成功: ${resource} ttl=${ttlSeconds}s`)
    } else {
      this.lockFailed += 1
      this.logger.warn(`[锁SPI] tryLock 失败（已被占用）: ${resource}`)
    }
    return token
  }

  async unlock(resource: string, token: string): Promise<boolean> {
    const ok = await this.inner.unlock(resource, token)
    if (ok) this.lockReleased += 1
    return ok
  }
}

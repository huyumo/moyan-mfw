/**
 * @fileoverview RedisLock - ILedgerLock 的 Redis 实现
 * @description 包装 base IRedisOnlyService.tryLock/unlock（SET NX EX + Lua 安全释放）
 *
 * 评审 A4🔴1/A4🔴3 修正：
 *   - base 的 getClient()/tryLock() 在 driver=redis 但断连时抛异常（非返回 null）
 *   - memory 驱动下 tryLock 是进程内锁（假分布式锁）
 *   - 故本实现：try/catch 包裹所有调用；getClient()===null 视为非 Redis -> 降级返回 null
 *   - 多实例部署必须 driver=redis
 *
 * 启用方式：LedgerModule.forRoot({ lockImpl: RedisLock })
 */

import { Injectable, Inject, Logger } from '@nestjs/common'
import { REDIS_ONLY_SERVICE, type IRedisOnlyService } from 'moyan-mfw-base/backend'
import type { ILedgerLock } from '../interfaces'

@Injectable()
export class RedisLock implements ILedgerLock {
  private readonly logger = new Logger(RedisLock.name)
  private static readonly PREFIX = 'ledger:lock:'

  constructor(@Inject(REDIS_ONLY_SERVICE) private readonly redis: IRedisOnlyService) {}

  async tryLock(resource: string, ttlSeconds: number): Promise<string | null> {
    // 校验是否真 Redis（memory 驱动 getClient() 返回 null -> 非真分布式锁）
    const client = this.redis.getClient()
    if (!client) {
      this.logger.warn(`Redis 不可用（非 redis 驱动），tryLock 降级返回 null: ${resource}`)
      return null
    }
    try {
      return await this.redis.tryLock(`${RedisLock.PREFIX}${resource}`, ttlSeconds)
    } catch (err: any) {
      this.logger.warn(`Redis tryLock 异常（降级返回 null）: ${resource} - ${err?.message}`)
      return null
    }
  }

  async unlock(resource: string, token: string): Promise<boolean> {
    const client = this.redis.getClient()
    if (!client) return false
    try {
      return await this.redis.unlock(`${RedisLock.PREFIX}${resource}`, token)
    } catch (err: any) {
      this.logger.warn(`Redis unlock 异常: ${resource} - ${err?.message}`)
      return false
    }
  }
}

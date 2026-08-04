/**
 * @fileoverview Redis 分布式锁实现（可选）
 * @description 包装 base 包 IRedisOnlyService.tryLock/unlock（SET NX EX + Lua 安全释放）
 *   启用方式：SchedulerModule.forRoot({ lockImpl: RedisLockService })
 *   前提：base 包 CacheModule 需配置 Redis 驱动
 */

import { Injectable, Inject } from '@nestjs/common'
import { REDIS_ONLY_SERVICE, type IRedisOnlyService } from 'moyan-mfw-base/backend'
import { IDistributedLock } from '../interfaces/distributed-lock.interface'

@Injectable()
export class RedisLockService implements IDistributedLock {
  private static readonly PREFIX = 'scheduler:lock:'

  constructor(
    @Inject(REDIS_ONLY_SERVICE) private readonly redis: IRedisOnlyService,
  ) {}

  async tryLock(resource: string, ttlSeconds = 30): Promise<string | null> {
    return this.redis.tryLock(`${RedisLockService.PREFIX}${resource}`, ttlSeconds)
  }

  async unlock(resource: string, token: string): Promise<boolean> {
    return this.redis.unlock(`${RedisLockService.PREFIX}${resource}`, token)
  }
}

/**
 * @fileoverview Redis 执行器注册表实现（可选）
 * @description 基于 Redis TTL key 的存活判定（TTL 60s，过期即离线，响应更快）
 *   启用方式：SchedulerModule.forRoot({ executorRegistryImpl: RedisExecutorRegistry })
 *   前提：base 包 CacheModule 需配置 Redis 驱动
 */

import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common'
import { REDIS_ONLY_SERVICE, type IRedisOnlyService } from 'moyan-mfw-base/backend'
import { IExecutorRegistry, ExecutorInfo } from '../interfaces/executor-registry.interface'

@Injectable()
export class RedisExecutorRegistry implements IExecutorRegistry, OnModuleInit {
  private readonly logger = new Logger(RedisExecutorRegistry.name)
  private static readonly PREFIX = 'scheduler:executor:'
  private static readonly TTL_SECONDS = 60

  constructor(
    @Inject(REDIS_ONLY_SERVICE) private readonly redis: IRedisOnlyService,
  ) {}

  async onModuleInit(): Promise<void> {
    const client = this.redis.getClient()
    if (!client) {
      this.logger.warn('Redis 不可用，执行器注册表将无法工作（请检查 CacheModule 驱动配置）')
    }
  }

  private key(executorId: string): string {
    return `${RedisExecutorRegistry.PREFIX}${executorId}`
  }

  async register(executor: ExecutorInfo): Promise<void> {
    // Redis key 创建即注册（TTL 自动过期）
    await this.heartbeat(executor.executorId)
  }

  async heartbeat(executorId: string): Promise<void> {
    const client = this.redis.getClient()
    if (!client) return
    const data = JSON.stringify({
      executorId,
      hostname: null, // 由注册时的信息补充
      pid: null,
      ts: Date.now(),
    })
    await client.set(this.key(executorId), data, { EX: RedisExecutorRegistry.TTL_SECONDS })
  }

  async getAliveExecutors(): Promise<ExecutorInfo[]> {
    const client = this.redis.getClient()
    if (!client) return []
    // SCAN 而非 KEYS，避免阻塞 Redis
    const executors: ExecutorInfo[] = []
    for await (const key of client.scanIterator({ MATCH: `${RedisExecutorRegistry.PREFIX}*`, COUNT: 100 })) {
      const data = await client.get(key)
      if (!data) continue
      try {
        const parsed = JSON.parse(data)
        executors.push({
          executorId: parsed.executorId,
          hostname: parsed.hostname ?? null,
          pid: parsed.pid ?? null,
          lastHeartbeat: new Date(parsed.ts ?? Date.now()),
        })
      } catch {
        // 忽略损坏数据
      }
    }
    return executors.sort((a, b) => a.executorId.localeCompare(b.executorId))
  }

  async unregister(executorId: string): Promise<void> {
    const client = this.redis.getClient()
    if (!client) return
    await client.del(this.key(executorId))
  }
}

/**
 * @fileoverview Redis 分布式锁适配器
 * @description 基于 Redis SET NX EX + Lua 比较删除实现 IDistributedLock
 * 替代默认的 DbLock，提供真正的分布式互斥能力
 *
 * 使用方式：
 *   SchedulerModule.forRoot({
 *     lockImpl: RedisLock,
 *   })
 *
 * 需要 CACHE_DRIVER=redis 或本机 Redis 可连接
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { createClient, type RedisClientType } from 'redis'
import type { IDistributedLock } from 'moyan-mfw-extension-scheduler/backend'

@Injectable()
export class RedisLock implements IDistributedLock, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisLock.name)
  private client: RedisClientType | null = null

  /** Lua 比较删除脚本：仅当 token 匹配时才删除锁 */
  private readonly UNLOCK_SCRIPT = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `

  async onModuleInit(): Promise<void> {
    const host = process.env.REDIS_HOST || 'localhost'
    const port = process.env.REDIS_PORT || '6379'
    const password = process.env.REDIS_PASSWORD || undefined
    const db = process.env.REDIS_DB ? Number(process.env.REDIS_DB) : undefined

    try {
      this.client = createClient({
        url: `redis://${password ? ':' + password + '@' : ''}${host}:${port}`,
        database: db,
      }) as RedisClientType

      this.client.on('error', (err) => {
        this.logger.error(`Redis 连接错误: ${err.message}`)
      })

      // connect() 在 Redis 不可用时会进入重试循环，长时间不 resolve，
      // 导致 onModuleInit 阻塞 NestJS bootstrap（app.listen 永远不被调用）。
      // 加 5 秒超时，超时后回退到无锁模式，不阻塞应用启动。
      await Promise.race([
        this.client.connect(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Redis 连接超时（5s）')), 5000),
        ),
      ])
      this.logger.log(`Redis 分布式锁已连接: ${host}:${port}`)
    } catch (err) {
      this.logger.error(`Redis 连接失败，回退到无锁模式: ${err instanceof Error ? err.message : String(err)}`)
      // 主动关闭 client，避免后台残留重试连接持续刷错误日志
      if (this.client) {
        try { await this.client.disconnect() } catch { /* 忽略关闭错误 */ }
        this.client = null
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit()
      this.client = null
    }
  }

  /**
   * 尝试获取分布式锁
   * @description 使用 SET resource token NX EX ttlSeconds 原子操作
   * @returns 成功返回 token，失败返回 null
   */
  async tryLock(resource: string, ttlSeconds: number): Promise<string | null> {
    if (!this.client) return null

    const key = `scheduler:lock:${resource}`
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`

    try {
      const result = await this.client.set(key, token, {
        NX: true,      // 仅在 key 不存在时设置
        EX: ttlSeconds, // 过期时间（秒）
      })
      return result === 'OK' ? token : null
    } catch (err) {
      this.logger.error(`tryLock 失败 [${resource}]: ${err instanceof Error ? err.message : String(err)}`)
      return null
    }
  }

  /**
   * 释放分布式锁
   * @description 使用 Lua 脚本比较 token 后删除，防止误删他人持有的锁
   * @returns 是否删除成功
   */
  async unlock(resource: string, token: string): Promise<boolean> {
    if (!this.client) return false

    const key = `scheduler:lock:${resource}`

    try {
      const result = await this.client.eval(this.UNLOCK_SCRIPT, {
        keys: [key],
        arguments: [token],
      })
      return result === 1
    } catch (err) {
      this.logger.error(`unlock 失败 [${resource}]: ${err instanceof Error ? err.message : String(err)}`)
      return false
    }
  }
}

/**
 * @fileoverview Redis pub/sub 通知实现（可选）
 * @description 替代 PollingNotify（轮询），通过 Redis pub/sub 实现延迟任务即时通知
 *   启用方式：SchedulerModule.forRoot({ notifyImpl: RedisNotifyService })
 *   前提：base 包 CacheModule 需配置 Redis 驱动
 */

import { Injectable, Logger, Inject, OnModuleDestroy } from '@nestjs/common'
import { REDIS_ONLY_SERVICE, type IRedisOnlyService } from 'moyan-mfw-base/backend'
import { IRuntimeNotify } from '../interfaces/runtime-notify.interface'

@Injectable()
export class RedisNotifyService implements IRuntimeNotify, OnModuleDestroy {
  private readonly logger = new Logger(RedisNotifyService.name)
  private static readonly CHANNEL = 'scheduler:task:scheduled'
  private callback: ((taskCode: string, executeAt: Date) => void) | null = null
  private subscriber: any = null

  constructor(
    @Inject(REDIS_ONLY_SERVICE) private readonly redis: IRedisOnlyService,
  ) {}

  async notifyTaskScheduled(taskCode: string, executeAt: Date): Promise<void> {
    const client = this.redis.getClient()
    if (!client) return
    try {
      await client.publish(RedisNotifyService.CHANNEL, JSON.stringify({
        taskCode,
        executeAt: executeAt.toISOString(),
      }))
    } catch (err) {
      this.logger.warn(`Redis publish 失败: ${(err as Error).message}`)
    }
  }

  onScheduled(callback: (taskCode: string, executeAt: Date) => void): void {
    this.callback = callback
    // 订阅 Redis 频道
    const client = this.redis.getClient()
    if (!client) {
      this.logger.warn('Redis 不可用，将使用轮询方式（60s 间隔）')
      return
    }
    this.subscriber = client.duplicate()
    this.subscriber.connect()
    this.subscriber.subscribe(RedisNotifyService.CHANNEL, (message: string) => {
      try {
        const { taskCode, executeAt } = JSON.parse(message)
        if (this.callback) {
          this.callback(taskCode, new Date(executeAt))
        }
      } catch (err) {
        this.logger.error(`解析通知消息失败: ${(err as Error).message}`)
      }
    }).catch((err: Error) => {
      this.logger.warn(`Redis 订阅失败，将使用轮询: ${err.message}`)
    })
  }

  async onModuleDestroy(): Promise<void> {
    if (this.subscriber) {
      try {
        await this.subscriber.unsubscribe(RedisNotifyService.CHANNEL)
        await this.subscriber.quit()
      } catch {
        // 忽略
      }
    }
  }
}
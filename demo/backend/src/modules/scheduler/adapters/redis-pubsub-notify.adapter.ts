/**
 * @fileoverview Redis PubSub 运行时通知适配器
 * @description 基于 Redis 发布/订阅实现 IRuntimeNotify
 * 替代默认的 PollingNotify，消除 60s 轮询延迟，实现即时通知
 *
 * 使用方式：
 *   SchedulerModule.forRoot({
 *     notifyImpl: RedisPubSubNotify,
 *   })
 *
 * 原理：
 *   - notifyTaskScheduled: PUBLISH 到 scheduler:notify 频道
 *   - onScheduled: SUBSCRIBE scheduler:notify 频道，收到消息触发回调
 *   - 使用独立订阅连接（订阅连接被阻塞监听，不能复用命令连接）
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { createClient, type RedisClientType } from 'redis'
import type { IRuntimeNotify } from 'moyan-mfw-extension-scheduler/backend'

/** 通知消息结构 */
interface NotifyMessage {
  taskCode: string
  executeAt: string // ISO 字符串
}

/** Redis pub/sub 频道 */
const CHANNEL = 'scheduler:notify'

@Injectable()
export class RedisPubSubNotify implements IRuntimeNotify, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisPubSubNotify.name)
  /** 发布客户端（命令连接） */
  private publisher: RedisClientType | null = null
  /** 订阅客户端（独立连接，被 SUBSCRIBE 阻塞） */
  private subscriber: RedisClientType | null = null
  /** 已注册的回调列表 */
  private callbacks: Array<(taskCode: string, executeAt: Date) => void> = []

  async onModuleInit(): Promise<void> {
    const host = process.env.REDIS_HOST || 'localhost'
    const port = process.env.REDIS_PORT || '6379'
    const password = process.env.REDIS_PASSWORD || undefined
    const db = process.env.REDIS_DB ? Number(process.env.REDIS_DB) : undefined

    const url = `redis://${password ? ':' + password + '@' : ''}${host}:${port}`

    // connect() 在 Redis 不可用时会进入重试循环，长时间不 resolve，
    // 导致 onModuleInit 阻塞 NestJS bootstrap（app.listen 永远不被调用）。
    // 加 5 秒超时包装，超时后回退到轮询模式，不阻塞应用启动。
    const connectWithTimeout = (client: RedisClientType, label: string) =>
      Promise.race([
        client.connect(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`${label} 连接超时（5s）`)), 5000),
        ),
      ])

    try {
      // 创建发布客户端
      this.publisher = createClient({ url, database: db }) as RedisClientType
      this.publisher.on('error', (err) => {
        this.logger.error(`Redis Publisher 错误: ${err.message}`)
      })
      await connectWithTimeout(this.publisher, 'Publisher')

      // 创建独立订阅客户端（不能复用发布连接）
      this.subscriber = createClient({ url, database: db }) as RedisClientType
      this.subscriber.on('error', (err) => {
        this.logger.error(`Redis Subscriber 错误: ${err.message}`)
      })
      await connectWithTimeout(this.subscriber, 'Subscriber')

      // 订阅通知频道
      await this.subscriber.subscribe(CHANNEL, (message: string) => {
        try {
          const msg: NotifyMessage = JSON.parse(message)
          const executeAt = new Date(msg.executeAt)
          // 触发所有已注册的回调
          for (const cb of this.callbacks) {
            try {
              cb(msg.taskCode, executeAt)
            } catch (err) {
              this.logger.error(`通知回调执行错误: ${err instanceof Error ? err.message : String(err)}`)
            }
          }
        } catch (err) {
          this.logger.error(`通知消息解析失败: ${err instanceof Error ? err.message : String(err)}`)
        }
      })

      this.logger.log(`Redis PubSub 通知已连接 (channel=${CHANNEL})`)
    } catch (err) {
      this.logger.error(`Redis PubSub 连接失败，回退到轮询模式: ${err instanceof Error ? err.message : String(err)}`)
      // 主动关闭残留 client，避免后台重试连接持续刷错误日志
      for (const client of [this.publisher, this.subscriber]) {
        if (client) {
          try { await client.disconnect() } catch { /* 忽略关闭错误 */ }
        }
      }
      this.publisher = null
      this.subscriber = null
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.unsubscribe(CHANNEL)
      await this.subscriber.quit()
      this.subscriber = null
    }
    if (this.publisher) {
      await this.publisher.quit()
      this.publisher = null
    }
  }

  /**
   * 通知有新任务被调度
   * @description PUBLISH 到 scheduler:notify 频道
   */
  async notifyTaskScheduled(taskCode: string, executeAt: Date): Promise<void> {
    if (!this.publisher) return // Redis 不可用时静默跳过，靠轮询兜底

    const message: NotifyMessage = {
      taskCode,
      executeAt: executeAt.toISOString(),
    }

    try {
      await this.publisher.publish(CHANNEL, JSON.stringify(message))
    } catch (err) {
      this.logger.error(`PUBLISH 失败 [${taskCode}]: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  /**
   * 注册调度通知回调
   * @description 收到 PUBLISH 消息后触发，调用引擎即时重载窗口
   */
  onScheduled(callback: (taskCode: string, executeAt: Date) => void): void {
    this.callbacks.push(callback)
  }
}

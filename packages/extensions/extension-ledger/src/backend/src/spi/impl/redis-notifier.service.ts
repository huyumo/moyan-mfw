/**
 * @fileoverview RedisNotifier - ILedgerNotifier 的 Redis Pub/Sub 实现
 * @description 跨实例事件广播；duplicate 独立连接订阅；Redis 不可用降级 EventNotifier（进程内）
 *
 * 启用方式：LedgerModule.forRoot({ notifierImpl: RedisNotifier })
 * 前提：base CacheModule 配置 redis 驱动
 */

import { Injectable, Inject, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { REDIS_ONLY_SERVICE, type IRedisOnlyService } from 'moyan-mfw-base/backend'
import type {
  ILedgerNotifier,
  LedgerEventListener,
  TransferPostedEvent,
  TransferFailedEvent,
  ReconcileDiffEvent,
} from '../interfaces'

const CHANNEL = 'mfw:ledger:events'

/** 事件消息封装 */
interface EventMessage {
  type: 'posted' | 'failed' | 'reconcile_diff'
  payload: TransferPostedEvent | TransferFailedEvent | ReconcileDiffEvent
}

@Injectable()
export class RedisNotifier implements ILedgerNotifier, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisNotifier.name)
  private readonly listeners: LedgerEventListener[] = []
  private subscriber: any = null
  private pubSubReady = false

  constructor(@Inject(REDIS_ONLY_SERVICE) private readonly redis: IRedisOnlyService) {}

  async onModuleInit(): Promise<void> {
    const client = this.redis.getClient()
    if (!client) {
      this.logger.warn('Redis 不可用，RedisNotifier 降级为进程内（跨实例广播失效）')
      return
    }
    try {
      // duplicate 独立连接订阅（不阻塞主连接）
      this.subscriber = client.duplicate()
      await this.subscriber.connect()
      await this.subscriber.subscribe(CHANNEL, (raw: string) => {
        try {
          const msg: EventMessage = JSON.parse(raw)
          this.dispatchLocal(msg)
        } catch (err: any) {
          this.logger.error(`解析订阅消息失败: ${err?.message}`)
        }
      })
      this.pubSubReady = true
      this.logger.log('RedisNotifier Pub/Sub 已就绪')
    } catch (err: any) {
      this.logger.warn(`RedisNotifier 订阅失败（降级进程内）: ${err?.message}`)
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.subscriber) {
      try {
        await this.subscriber.unsubscribe(CHANNEL)
        await this.subscriber.quit()
      } catch {
        // 忽略关闭异常
      }
    }
  }

  registerListener(listener: LedgerEventListener): void {
    this.listeners.push(listener)
  }

  async emitTransferPosted(event: TransferPostedEvent): Promise<void> {
    await this.publish({ type: 'posted', payload: event })
  }

  async emitTransferFailed(event: TransferFailedEvent): Promise<void> {
    await this.publish({ type: 'failed', payload: event })
  }

  async emitReconcileDiff(event: ReconcileDiffEvent): Promise<void> {
    await this.publish({ type: 'reconcile_diff', payload: event })
  }

  /** 发布事件（Pub/Sub 广播 + 本地分发） */
  private async publish(msg: EventMessage): Promise<void> {
    // 本地分发（同实例监听器立即响应）
    this.dispatchLocal(msg)
    // 跨实例广播
    if (!this.pubSubReady) return
    try {
      const client = this.redis.getClient()
      if (client) await client.publish(CHANNEL, JSON.stringify(msg))
    } catch (err: any) {
      this.logger.warn(`Redis publish 失败（仅本地分发）: ${err?.message}`)
    }
  }

  /** 本地分发（监听器异常旁路隔离） */
  private dispatchLocal(msg: EventMessage): void {
    for (const listener of this.listeners) {
      try {
        if (msg.type === 'posted') listener.onTransferPosted?.(msg.payload as TransferPostedEvent)
        else if (msg.type === 'failed') listener.onTransferFailed?.(msg.payload as TransferFailedEvent)
        else if (msg.type === 'reconcile_diff') listener.onReconcileDiff?.(msg.payload as ReconcileDiffEvent)
      } catch (err: any) {
        this.logger.error(`通知监听器失败 (${msg.type}): ${err?.message}`, err?.stack)
      }
    }
  }
}

/**
 * @fileoverview 账本消息队列 SPI 演示实现（ILedgerQueue 包装替换）
 * @description 包装默认 InProcessQueue 增加 enqueue/ack/延迟重试计数，展示 queueImpl 替换位写法（监控/埋点场景）。
 *
 * 多实例部署必须换包内置 RedisStreamQueue（消费组 + XAUTOCLAIM，需 base CACHE_DRIVER=redis）：
 *   queueImpl: RedisStreamQueue
 */

import { Injectable, Logger } from '@nestjs/common'
import {
  InProcessQueue,
  type ILedgerQueue,
  type QueueMessageHandler,
} from 'moyan-mfw-extension-ledger/backend'

@Injectable()
export class DemoLedgerQueue implements ILedgerQueue {
  private readonly logger = new Logger(DemoLedgerQueue.name)
  private readonly inner = new InProcessQueue()

  /** 队列统计（供用例查询：积压监控/埋点） */
  enqueueCount = 0
  ackCount = 0
  nackCount = 0

  async enqueue(transferNo: string, delayMs = 0): Promise<void> {
    this.enqueueCount += 1
    this.logger.log(`[队列SPI] enqueue transferNo=${transferNo} delayMs=${delayMs}`)
    return this.inner.enqueue(transferNo, delayMs)
  }

  startConsumer(consumerId: string, concurrency: number, handler: QueueMessageHandler): Promise<void> {
    this.logger.log(`[队列SPI] startConsumer consumerId=${consumerId} concurrency=${concurrency}`)
    return this.inner.startConsumer(consumerId, concurrency, handler)
  }

  stopConsumer(): Promise<void> {
    return this.inner.stopConsumer()
  }

  async ack(messageId: string): Promise<void> {
    this.ackCount += 1
    return this.inner.ack(messageId)
  }

  async nackAndRequeue(messageId: string, transferNo: string, delayMs: number): Promise<void> {
    this.nackCount += 1
    this.logger.warn(`[队列SPI] nackAndRequeue transferNo=${transferNo} delayMs=${delayMs}`)
    return this.inner.nackAndRequeue(messageId, transferNo, delayMs)
  }

  length(): Promise<number> {
    return this.inner.length()
  }
}

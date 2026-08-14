/**
 * @fileoverview InProcessQueue - ILedgerQueue 默认实现（进程内队列，仅单实例）
 * @description 多实例部署必须换 RedisStreamQueue（README 部署硬约束）
 *
 * 消息可靠性：进程崩溃丢消息 -> 靠兜底扫描（30s）补发
 * XACK 协议：ack/nackAndRequeue 用 messageId（本实现以 transferNo 代号）
 */

import { Injectable, Logger } from '@nestjs/common'
import type { ILedgerQueue, QueueMessageHandler } from '../interfaces'

interface QueueItem {
  transferNo: string
  executeAt: number
  messageId: string
}

@Injectable()
export class InProcessQueue implements ILedgerQueue {
  private readonly logger = new Logger(InProcessQueue.name)
  /** 立即队列（FIFO） */
  private readonly ready: QueueItem[] = []
  /** 延迟队列（按 executeAt 排序） */
  private readonly delayed: QueueItem[] = []
  private consumerLoop: NodeJS.Timeout | null = null
  private handler: QueueMessageHandler | null = null
  private concurrency = 10
  private running = 0
  private consumerId = ''
  private seq = 0

  async enqueue(transferNo: string, delayMs = 0): Promise<void> {
    const item: QueueItem = {
      transferNo,
      executeAt: Date.now() + delayMs,
      messageId: `inproc-${this.seq++}`,
    }
    if (delayMs > 0) {
      this.delayed.push(item)
      this.delayed.sort((a, b) => a.executeAt - b.executeAt)
    } else {
      this.ready.push(item)
    }
  }

  async startConsumer(consumerId: string, concurrency: number, handler: QueueMessageHandler): Promise<void> {
    this.consumerId = consumerId
    this.concurrency = concurrency
    this.handler = handler
    if (this.consumerLoop) return
    // 200ms tick：搬运到期延迟消息 + 消费就绪消息
    this.consumerLoop = setInterval(() => this.tick(), 200)
  }
  async stopConsumer(): Promise<void> {
    if (this.consumerLoop) {
      clearInterval(this.consumerLoop)
      this.consumerLoop = null
    }
    this.handler = null
  }

  async ack(messageId: string): Promise<void> {
    // 进程内队列无需显式 ACK（消费即移除）
    void messageId
  }

  async nackAndRequeue(messageId: string, transferNo: string, delayMs: number): Promise<void> {
    // 失败重入队（延迟）
    void messageId
    await this.enqueue(transferNo, delayMs)
  }

  async length(): Promise<number> {
    return this.ready.length + this.delayed.length
  }

  private tick(): void {
    if (!this.handler) return
    // 搬运到期延迟消息
    const now = Date.now()
    while (this.delayed.length > 0 && this.delayed[0].executeAt <= now) {
      this.ready.push(this.delayed.shift()!)
    }
    // 消费就绪消息（受并发上限背压）
    while (this.running < this.concurrency && this.ready.length > 0) {
      const item = this.ready.shift()!
      this.running++
      this.consume(item)
    }
  }

  private async consume(item: QueueItem): Promise<void> {
    try {
      await this.handler!(item.transferNo, item.messageId)
    } catch (err: any) {
      this.logger.error(`消费失败 ${item.transferNo}: ${err?.message}`, err?.stack)
    } finally {
      this.running--
    }
  }
}

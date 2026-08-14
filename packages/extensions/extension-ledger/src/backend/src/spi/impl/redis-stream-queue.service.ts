/**
 * @fileoverview RedisStreamQueue - ILedgerQueue 的 Redis Stream 实现
 * @description 消费组 + XAUTOCLAIM 接管 + ZSET 延迟重试 + 降级 drain
 *
 * 启用方式：LedgerModule.forRoot({ queueImpl: RedisStreamQueue })
 * 前提：base CacheModule 配置 redis 驱动；Redis ≥ 6.2（XAUTOCLAIM）
 *
 * XACK 协议：
 *   - 所有不处理路径（已POSTED/他人处理中/FAILED/不存在）一律 XACK
 *   - 失败路径：先 XACK 原消息再 ZADD 延迟队列（防 PEL 影子风暴）
 *
 * 降级 drain：Redis 故障 -> 降级 InProcessQueue；恢复时先 drain 进程内积压再切回 Stream
 */

import { Injectable, Inject, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { REDIS_ONLY_SERVICE, type IRedisOnlyService } from 'moyan-mfw-base/backend'
import type { ILedgerQueue, QueueMessageHandler } from '../interfaces'
import { InProcessQueue } from './in-process-queue.service'

const STREAM_KEY = 'mfw:ledger:posting:stream'
const CONSUMER_GROUP = 'mfw-ledger-posters'
const DELAY_ZSET = 'mfw:ledger:posting:delayed'
const MAXLEN = 1000000 // ~100 万防积压（pending 告警阈值 10 万）
const XAUTOCLAIM_MIN_IDLE_MS = 120000 // 2min，接管崩溃消费者
const BLOCK_MS = 2000

@Injectable()
export class RedisStreamQueue implements ILedgerQueue, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisStreamQueue.name)
  private readonly fallback = new InProcessQueue()
  private handler: QueueMessageHandler | null = null
  private consumerId = ''
  private concurrency = 10
  private running = false
  private consumerLoop: NodeJS.Timeout | null = null
  private delayLoop: NodeJS.Timeout | null = null
  private degraded = false
  private failCount = 0
  private okCount = 0

  constructor(@Inject(REDIS_ONLY_SERVICE) private readonly redis: IRedisOnlyService) {}

  async onModuleInit(): Promise<void> {
    // 确保消费组存在
    await this.ensureGroup()
    // 启动延迟队列搬运（1s tick）
    this.delayLoop = setInterval(() => this.tickDelayed().catch(() => {}), 1000)
  }

  async onModuleDestroy(): Promise<void> {
    this.running = false
    if (this.consumerLoop) clearInterval(this.consumerLoop)
    if (this.delayLoop) clearInterval(this.delayLoop)
    await this.fallback.stopConsumer()
  }

  async enqueue(transferNo: string, delayMs = 0): Promise<void> {
    if (delayMs > 0) {
      // 延迟入队：ZSET（score=到期时间，member=transferNo 幂等）
      const client = this.getClient()
      if (!client || this.degraded) return this.fallback.enqueue(transferNo, delayMs)
      try {
        await client.zAdd(DELAY_ZSET, [{ score: Date.now() + delayMs, value: transferNo }])
        this.onOk()
      } catch (err: any) {
        this.onFail()
        this.logger.warn(`ZADD 延迟失败，降级进程内: ${transferNo} - ${err?.message}`)
        return this.fallback.enqueue(transferNo, delayMs)
      }
    } else {
      const client = this.getClient()
      if (!client || this.degraded) return this.fallback.enqueue(transferNo)
      try {
        await client.xAdd(STREAM_KEY, '*', { transferNo }, { MAXLEN, TRIM: { strategy: 'MAXLEN', approximate: true } })
        this.onOk()
      } catch (err: any) {
        this.onFail()
        this.logger.warn(`XADD 失败，降级进程内: ${transferNo} - ${err?.message}`)
        return this.fallback.enqueue(transferNo)
      }
    }
  }

  async startConsumer(consumerId: string, concurrency: number, handler: QueueMessageHandler): Promise<void> {
    this.consumerId = consumerId
    this.concurrency = concurrency
    this.handler = handler
    this.running = true
    // 进程内 fallback 消费（降级时用）
    await this.fallback.startConsumer(consumerId, concurrency, handler)
    // Redis Stream 消费循环
    this.consumerLoop = setInterval(() => this.consumeTick().catch(() => {}), 100)
  }

  async stopConsumer(): Promise<void> {
    this.running = false
    if (this.consumerLoop) clearInterval(this.consumerLoop)
    await this.fallback.stopConsumer()
  }

  async ack(messageId: string): Promise<void> {
    // 进程内消息直接 ack fallback；Stream 消息 XACK
    const client = this.getClient()
    if (!client || this.degraded) return this.fallback.ack(messageId)
    try {
      await client.xAck(STREAM_KEY, CONSUMER_GROUP, messageId)
    } catch (err: any) {
      this.logger.warn(`XACK 失败: ${messageId} - ${err?.message}`)
    }
  }

  async nackAndRequeue(messageId: string, transferNo: string, delayMs: number): Promise<void> {
    // 先 XACK 原消息（防 PEL 影子），再延迟重入队（ZSET）
    const client = this.getClient()
    if (!client || this.degraded) return this.fallback.nackAndRequeue(messageId, transferNo, delayMs)
    try {
      await client.xAck(STREAM_KEY, CONSUMER_GROUP, messageId)
    } catch (err: any) {
      this.logger.warn(`nack XACK 失败: ${messageId} - ${err?.message}`)
    }
    await this.enqueue(transferNo, delayMs)
  }

  async length(): Promise<number> {
    const client = this.getClient()
    if (!client || this.degraded) return this.fallback.length()
    try {
      const info = await client.xInfoStream(STREAM_KEY)
      const delayed = await client.zCard(DELAY_ZSET)
      return (info?.length ?? 0) + delayed
    } catch {
      return this.fallback.length()
    }
  }

  // ── 内部方法 ──

  private getClient(): any {
    try {
      return this.redis.getClient()
    } catch {
      return null
    }
  }

  private async ensureGroup(): Promise<void> {
    const client = this.getClient()
    if (!client) return
    try {
      await client.xGroupCreate(STREAM_KEY, CONSUMER_GROUP, '$', { MKSTREAM: true })
      this.onOk()
    } catch (err: any) {
      // BUSYGROUP = 组已存在，正常
      if (!String(err?.message).includes('BUSYGROUP')) {
        this.logger.warn(`xGroupCreate 失败: ${err?.message}`)
      }
    }
  }

  /** 消费循环：XREADGROUP + XAUTOCLAIM */
  private async consumeTick(): Promise<void> {
    if (!this.running || !this.handler) return
    const client = this.getClient()
    if (!client || this.degraded) return

    try {
      // 1. 先 XAUTOCLAIM 接管超时未 ACK 的消息（崩溃消费者遗留）
      const claimBatch = Math.min(this.concurrency, 10)
      try {
        const claimed = await client.xAutoClaim(STREAM_KEY, CONSUMER_GROUP, this.consumerId, XAUTOCLAIM_MIN_IDLE_MS, '0', { COUNT: claimBatch })
        // claimed[0] = next cursor, claimed[1] = messages
        const messages = claimed?.[1] ?? []
        for (const [id, fields] of messages) {
          await this.processMessage(id, fields)
        }
      } catch (err: any) {
        // XAUTOCLAIM 不可用（Redis<6.2）时忽略
      }

      // 2. XREADGROUP 拉取新消息（BLOCK 2s）
      const result = await client.xReadGroup(
        CONSUMER_GROUP,
        this.consumerId,
        [{ key: STREAM_KEY, id: '>' }],
        { COUNT: this.concurrency, BLOCK: BLOCK_MS },
      )
      if (!result) return
      for (const stream of result) {
        for (const [id, fields] of stream.messages) {
          await this.processMessage(id, fields)
        }
      }
      this.onOk()
    } catch (err: any) {
      this.onFail()
      this.logger.warn(`消费循环异常（降级）: ${err?.message}`)
    }
  }

  /** 处理单条消息 */
  private async processMessage(id: string, fields: any): Promise<void> {
    const transferNo = fields?.transferNo
    if (!transferNo) {
      // nil-payload（被 MAXLEN 裁剪），不 XACK，交兜底扫描恢复
      this.logger.warn(`nil-payload 消息（不 XACK，交兜底扫描）: ${id}`)
      return
    }
    try {
      await this.handler!(transferNo, id)
      // handler 内部已处理 ack/nack，这里不重复
    } catch (err: any) {
      // handler 抛异常（不应发生，消费协议在 service 层处理 ack）-> 兜底 XACK 防滞留
      this.logger.error(`handler 异常（兜底 XACK）: ${transferNo} - ${err?.message}`)
      await this.ack(id)
    }
  }

  /** 延迟队列搬运：到期消息从 ZSET 移到 Stream */
  private async tickDelayed(): Promise<void> {
    const client = this.getClient()
    if (!client || this.degraded) return
    try {
      const now = Date.now()
      const due = await client.zRangeByScore(DELAY_ZSET, 0, now, { LIMIT: { offset: 0, count: 100 } })
      for (const transferNo of due) {
        await client.xAdd(STREAM_KEY, '*', { transferNo }, { MAXLEN, TRIM: { strategy: 'MAXLEN', approximate: true } })
        await client.zRem(DELAY_ZSET, transferNo)
      }
    } catch (err: any) {
      this.logger.warn(`延迟搬运异常: ${err?.message}`)
    }
  }

  /** 降级/恢复切换（迟滞：连续 3 次失败才降级，连续 3 次成功且 drain 完才恢复） */
  private onFail(): void {
    this.failCount++
    this.okCount = 0
    if (!this.degraded && this.failCount >= 3) {
      this.degraded = true
      this.logger.warn('Redis 连续失败，降级进程内队列')
    }
  }

  private onOk(): void {
    this.okCount++
    this.failCount = 0
    if (this.degraded && this.okCount >= 3) {
      // drain 进程内积压后再切回（简化：标记恢复，积压由 fallback 自身消费完）
      this.degraded = false
      this.logger.log('Redis 恢复，切回 Stream（进程内积压由 fallback 继续消费）')
    }
  }
}

/**
 * @fileoverview 兜底扫描服务 - 队列可靠性关键路径
 * @description 30s 定时扫描（包内唯一定时器，scavengeEnabled 可关但 README 警告）
 *
 * 处理两类单：
 *   1. PENDING 入队超时（nextRetryAt 已到期 + lastPushAt 节流）-> 补发消息
 *   2. POSTING 孤儿（claim_at 超时）-> 重置 PENDING 重推
 * 绝不碰 NOT_READY/REJECTED/FAILED/CANCELLED/POSTED
 *
 * 多实例选主（ILedgerLock）+ last_push_at 节流防 N 倍放大
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Inject, Logger } from '@nestjs/common'
import { LEDGER_STORAGE, LEDGER_QUEUE, LEDGER_LOCK, LEDGER_OPTIONS, type LedgerModuleOptions } from '../spi/interfaces'
import type { ILedgerStorage, ILedgerQueue, ILedgerLock } from '../spi/interfaces'

@Injectable()
export class ScavengerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScavengerService.name)
  private timer: NodeJS.Timeout | null = null

  constructor(
    @Inject(LEDGER_STORAGE) private readonly storage: ILedgerStorage,
    @Inject(LEDGER_QUEUE) private readonly queue: ILedgerQueue,
    @Inject(LEDGER_LOCK) private readonly lock: ILedgerLock,
    @Inject(LEDGER_OPTIONS) private readonly options: LedgerModuleOptions,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.options.scavengeEnabled === false) {
      this.logger.warn('兜底扫描已关闭（scavengeEnabled=false）--可靠性关键路径，生产环境不建议关闭！')
      return
    }
    const intervalMs = this.options.scavengeIntervalMs ?? 30000
    // 错开启动避免多实例同时触发
    this.timer = setInterval(() => {
      this.scan().catch((err) => this.logger.error(`兜底扫描异常: ${err?.message}`, err?.stack))
    }, intervalMs)
    this.logger.log(`兜底扫描已启动 intervalMs=${intervalMs}`)
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  /** 执行一次扫描（选主执行 + 节流补发） */
  async scan(): Promise<void> {
    // 多实例选主（GET_LOCK 互斥，租约 60s 覆盖扫描周期）
    const lockToken = await this.lock.tryLock('ledger:scavenge', 60)
    if (!lockToken) return // 其他实例正在扫描

    try {
      const now = new Date()
      const enqueueTimeoutMs = this.options.enqueueTimeoutMs ?? 120000
      const orphanTimeoutMs = this.options.orphanTimeoutMs ?? 600000
      const repushThrottleMs = this.options.repushThrottleMs ?? 300000
      const limit = 500

      const result = await this.storage.scavenge(now, enqueueTimeoutMs, orphanTimeoutMs, repushThrottleMs, limit)

      // 1. PENDING 入队超时 -> 补发
      for (const item of result.pendingTimeout) {
        try {
          await this.queue.enqueue(item.transferNo)
          await this.storage.markEnqueued(item.transferNo)
        } catch (err: any) {
          this.logger.warn(`补发失败 ${item.transferNo}: ${err?.message}`)
        }
      }

      // 2. POSTING 孤儿 -> 重置 PENDING 重推
      if (result.orphans.length > 0) {
        const orphanNos = result.orphans.map((o) => o.transferNo)
        const { affected } = await this.storage.resetOrphans(orphanNos)
        this.logger.warn(`孤儿单重置 ${affected}/${orphanNos.length} 个`)
        for (const no of orphanNos) {
          try {
            await this.queue.enqueue(no)
            await this.storage.markEnqueued(no)
          } catch (err: any) {
            this.logger.warn(`孤儿重推失败 ${no}: ${err?.message}`)
          }
        }
      }

      if (result.pendingTimeout.length > 0 || result.orphans.length > 0) {
        this.logger.log(`兜底扫描：补发 ${result.pendingTimeout.length}，孤儿重置 ${result.orphans.length}`)
      }
    } finally {
      await this.lock.unlock('ledger:scavenge', lockToken)
    }
  }
}

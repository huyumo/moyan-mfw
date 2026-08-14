/**
 * @fileoverview 入账消费者 - 核心状态机编排
 * @description OnModuleInit 启动消费者；XACK 协议；CAS fencing；失败分类（账务异常重试/fencing 放弃/业务失败直接 FAILED）
 *
 * 消费协议（评审修正）：
 *   1. 认领（PENDING->POSTING + claim_token），0 行=XACK 跳过
 *   2. 入账事务（末位 claim_token CAS），success=false 无 error=fencing 放弃
 *   3. 账务异常：回退 PENDING（带 claim_token 条件，0 行=已被接管放弃）+ 退避重入队
 *   4. 业务失败：直接 FAILED
 *   5. 重试耗尽：FAILED + 通知
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Inject, Logger } from '@nestjs/common'
import {
  LEDGER_STORAGE,
  LEDGER_QUEUE,
  LEDGER_NOTIFIER,
  LEDGER_OPTIONS,
  type LedgerModuleOptions,
} from '../spi/interfaces'
import type { ILedgerStorage, ILedgerQueue, ILedgerNotifier, PostResult } from '../spi/interfaces'
import { generateClaimToken, generateExecutorId } from './id-generator'
@Injectable()
export class PostingConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PostingConsumerService.name)
  private executorId: string

  constructor(
    @Inject(LEDGER_STORAGE) private readonly storage: ILedgerStorage,
    @Inject(LEDGER_QUEUE) private readonly queue: ILedgerQueue,
    @Inject(LEDGER_NOTIFIER) private readonly notifier: ILedgerNotifier,
    @Inject(LEDGER_OPTIONS) private readonly options: LedgerModuleOptions,
  ) {
    this.executorId = generateExecutorId()
  }

  async onModuleInit(): Promise<void> {
    if (this.options.consumerEnabled === false) {
      this.logger.log('消费者未启用（consumerEnabled=false）')
      return
    }
    const concurrency = this.options.consumerConcurrency ?? 10
    await this.queue.startConsumer(this.executorId, concurrency, async (transferNo, messageId) => {
      await this.consume(transferNo, messageId)
    })
    this.logger.log(`入账消费者已启动 executorId=${this.executorId} concurrency=${concurrency}`)
  }

  async onModuleDestroy(): Promise<void> {
    // 优雅停机：停止拉取（已处理的消息完成；本实例持有的 claim 靠兜底扫描恢复）
    await this.queue.stopConsumer()
    this.logger.log('入账消费者已停止')
  }

  /** 消费单条交易单 */
  private async consume(transferNo: string, messageId: string): Promise<void> {
    const claimToken = generateClaimToken(this.executorId)

    // 1. 认领
    const claim = await this.storage.claimForPosting(transferNo, claimToken)
    if (claim.affected === 0) {
      // 已被处理/他人认领/不存在 -> XACK 跳过（杜绝 PEL 影子消息）
      await this.queue.ack(messageId)
      return
    }

    const transfer = claim.transfer
    if (!transfer) {
      await this.queue.ack(messageId)
      return
    }

    // 2. 入账事务（末位 CAS fencing）
    let result: PostResult
    try {
      result = await this.storage.postTransfer(transferNo, claimToken)
    } catch (err: any) {
      // 入账事务抛异常（SQL 错误/连接中断等）→ 走账务异常回退协议，不卡死 POSTING
      result = { success: false, error: `入账事务异常: ${err?.message}` }
    }
    if (result.success) {
      // 成功 -> XACK + 通知
      await this.queue.ack(messageId)
      await this.notifier.emitTransferPosted({
        transferNo,
        fromAccountId: transfer.fromAccountId,
        toAccounts: transfer.toAccounts,
        amount: transfer.amount,
        currency: transfer.currency,
        postedAt: new Date(),
      })
      return
    }

    // fencing 失败（已被接管）-> 直接放弃（不重试、不重入队、不计 retry）
    if (!result.error) {
      this.logger.warn(`fencing 失败（已被接管），放弃 ${transferNo}`)
      await this.queue.ack(messageId)
      return
    }

    // 3. 失败分类
    const isBusinessError = this.isBusinessError(result.error)
    const retryCount = (transfer.retryCount ?? 0) + 1
    const maxRetry = this.options.maxRetry ?? 3

    if (isBusinessError || retryCount > maxRetry) {
      // 业务失败 或 重试耗尽 -> FAILED + 通知
      await this.storage.markFailed(transferNo, claimToken, result.error)
      await this.queue.ack(messageId)
      await this.notifier.emitTransferFailed({
        transferNo,
        retryCount,
        error: result.error,
        failedAt: new Date(),
      })
      this.logger.error(`入账失败（终态）${transferNo}: ${result.error}`)
      return
    }

    // 4. 账务异常 -> 回退 PENDING（带 claim_token 条件）+ 退避重入队
    const backoffMs = (this.options.retryBackoffMs ?? 1000) * Math.pow(2, retryCount - 1)
    const nextRetryAt = new Date(Date.now() + backoffMs)
    const revert = await this.storage.revertToPending(transferNo, claimToken, retryCount, nextRetryAt, result.error)
    if (revert.affected === 0) {
      // 已被接管 -> 放弃
      this.logger.warn(`回退 0 行（已被接管），放弃 ${transferNo}`)
      await this.queue.ack(messageId)
      return
    }
    // 先 XACK 原消息再延迟重入队（防 PEL 影子消息风暴）
    await this.queue.nackAndRequeue(messageId, transferNo, backoffMs)
    this.logger.warn(`入账失败（重试 ${retryCount}/${maxRetry}）${transferNo}: ${result.error}，${backoffMs}ms 后重试`)
  }

  /** 业务性失败判定（重试无意义，直接 FAILED） */
  private isBusinessError(error: string): boolean {
    return (
      error.includes('币种不一致') ||
      error.includes('账户不存在') ||
      error.includes('收款方') ||
      error.includes('转出方不能同时是收款方') ||
      error.includes('重复')
    )
  }
}

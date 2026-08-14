/**
 * @fileoverview 账本事件监听器（ILedgerNotifier.registerListener 调用案例）
 * @description 业务层监听账本事件：构造函数注入 LEDGER_NOTIFIER 并 registerListener 自注册
 * （对齐 merchant-member.listener 模式），收到的事件计数保存，供用例查询。
 *
 * 典型业务场景：记账完成后联动订单状态、发站内信；失败告警转人工；对账差异推送
 */

import { Inject, Injectable, Logger } from '@nestjs/common'
import {
  LEDGER_NOTIFIER,
  type ILedgerNotifier,
  type LedgerEventListener,
  type TransferPostedEvent,
  type TransferFailedEvent,
  type ReconcileDiffEvent,
} from 'moyan-mfw-extension-ledger/backend'

/** 监听事件记录（内存保存，供用例查询；生产可落库/推送） */
export interface LedgerDemoEventRecord {
  type: 'posted' | 'failed' | 'reconcile_diff'
  transferNo?: string
  reportId?: string
  at: string
}

@Injectable()
export class DemoLedgerNotifyListener implements LedgerEventListener {
  private readonly logger = new Logger(DemoLedgerNotifyListener.name)
  readonly events: LedgerDemoEventRecord[] = []

  constructor(@Inject(LEDGER_NOTIFIER) notifier: ILedgerNotifier) {
    // 自注册到账本通知器（LEDGER_NOTIFIER 由 LedgerModule exports 提供）
    notifier.registerListener(this)
    this.logger.log('[监听器] 已注册到账本通知器（ILedgerNotifier.registerListener）')
  }

  async onTransferPosted(event: TransferPostedEvent): Promise<void> {
    this.events.push({ type: 'posted', transferNo: event.transferNo, at: new Date().toISOString() })
    this.logger.log(`[监听器] 收到记账完成事件: ${event.transferNo}（业务可在此联动订单状态/发通知）`)
  }

  async onTransferFailed(event: TransferFailedEvent): Promise<void> {
    this.events.push({ type: 'failed', transferNo: event.transferNo, at: new Date().toISOString() })
    this.logger.warn(`[监听器] 收到记账失败事件: ${event.transferNo}（业务可在此告警/转人工）`)
  }

  async onReconcileDiff(event: ReconcileDiffEvent): Promise<void> {
    this.events.push({ type: 'reconcile_diff', reportId: event.reportId, at: new Date().toISOString() })
    this.logger.warn(`[监听器] 收到对账差异事件: ${event.reportId}（业务可在此推送运营）`)
  }
}

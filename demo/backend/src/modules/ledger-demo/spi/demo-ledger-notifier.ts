/**
 * @fileoverview 账本事件通知 SPI 演示实现（ILedgerNotifier 继承替换）
 * @description extends EventNotifier 增加事件日志，展示 notifierImpl 替换位写法。
 *
 * 业务监听器注册见 demo-ledger-notify-listener.ts：注入 LEDGER_NOTIFIER 后 registerListener 自注册
 * （多实例广播可换包内置 RedisNotifier Pub/Sub：notifierImpl: RedisNotifier）
 */

import { Injectable, Logger } from '@nestjs/common'
import {
  EventNotifier,
  type TransferPostedEvent,
  type TransferFailedEvent,
  type ReconcileDiffEvent,
} from 'moyan-mfw-extension-ledger/backend'

@Injectable()
export class DemoLedgerNotifier extends EventNotifier {
  // 基类 EventNotifier 已声明 private logger，此处用不同属性名避免冲突
  private readonly log = new Logger(DemoLedgerNotifier.name)

  async emitTransferPosted(event: TransferPostedEvent): Promise<void> {
    this.log.log(`[通知SPI] 记账完成事件 transferNo=${event.transferNo} amount=${event.amount}${event.currency}`)
    return super.emitTransferPosted(event)
  }

  async emitTransferFailed(event: TransferFailedEvent): Promise<void> {
    this.log.warn(`[通知SPI] 记账失败事件 transferNo=${event.transferNo} retry=${event.retryCount} error=${event.error}`)
    return super.emitTransferFailed(event)
  }

  async emitReconcileDiff(event: ReconcileDiffEvent): Promise<void> {
    this.log.warn(`[通知SPI] 对账差异事件 reportId=${event.reportId} diffCount=${event.diffCount}`)
    return super.emitReconcileDiff(event)
  }
}

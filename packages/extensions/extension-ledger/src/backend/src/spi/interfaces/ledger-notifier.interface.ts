/**
 * @fileoverview 事件通知 SPI 接口
 * @description 默认 EventNotifier（进程内 EventEmitter）；可换 RedisNotifier（Pub/Sub）
 *
 * 监听器异常旁路隔离（对齐 SpiEventBus 语义）：单个监听器抛异常不影响主流程，仅记录日志
 * 通知是旁路语义，丢失不影响一致性（对账兜底）
 */

/** 记账完成事件 */
export interface TransferPostedEvent {
  transferNo: string
  fromAccountId: string
  toAccounts: { account: string; amount: string }[]
  amount: string
  currency: string
  postedAt: Date
}

/** 记账失败事件 */
export interface TransferFailedEvent {
  transferNo: string
  retryCount: number
  error: string
  failedAt: Date
}

/** 对账差异事件 */
export interface ReconcileDiffEvent {
  reportId: string
  diffCount: number
  diffs: { accountId: string; diff: string }[]
  triggeredAt: Date
}

/** 事件监听器（可选方法，业务方只实现关心的） */
export interface LedgerEventListener {
  onTransferPosted?(event: TransferPostedEvent): Promise<void> | void
  onTransferFailed?(event: TransferFailedEvent): Promise<void> | void
  onReconcileDiff?(event: ReconcileDiffEvent): Promise<void> | void
}

export interface ILedgerNotifier {
  /** 注册监听器（业务方集成） */
  registerListener(listener: LedgerEventListener): void

  /** 触发记账完成事件 */
  emitTransferPosted(event: TransferPostedEvent): Promise<void>
  /** 触发记账失败事件 */
  emitTransferFailed(event: TransferFailedEvent): Promise<void>
  /** 触发对账差异事件 */
  emitReconcileDiff(event: ReconcileDiffEvent): Promise<void>
}

/**
 * @fileoverview EventNotifier - ILedgerNotifier 默认实现（进程内 EventEmitter）
 * @description 监听器异常旁路隔离（对齐 SpiEventBus 语义）：单个监听器抛异常不影响主流程，仅记录日志
 * 多实例场景换 RedisNotifier（Pub/Sub 广播到所有实例）
 */

import { Injectable, Logger } from '@nestjs/common'
import type {
  ILedgerNotifier,
  LedgerEventListener,
  TransferPostedEvent,
  TransferFailedEvent,
  ReconcileDiffEvent,
} from '../interfaces'

@Injectable()
export class EventNotifier implements ILedgerNotifier {
  private readonly logger = new Logger(EventNotifier.name)
  private readonly listeners: LedgerEventListener[] = []

  registerListener(listener: LedgerEventListener): void {
    this.listeners.push(listener)
  }

  async emitTransferPosted(event: TransferPostedEvent): Promise<void> {
    await this.dispatch((l) => l.onTransferPosted?.(event), 'onTransferPosted', event.transferNo)
  }

  async emitTransferFailed(event: TransferFailedEvent): Promise<void> {
    await this.dispatch((l) => l.onTransferFailed?.(event), 'onTransferFailed', event.transferNo)
  }

  async emitReconcileDiff(event: ReconcileDiffEvent): Promise<void> {
    await this.dispatch((l) => l.onReconcileDiff?.(event), 'onReconcileDiff', event.reportId)
  }

  /** 分发：单个监听器异常仅记录日志，不影响主流程（旁路语义） */
  private async dispatch(
    invoke: (l: LedgerEventListener) => Promise<void> | void,
    hookName: string,
    ref: string,
  ): Promise<void> {
    for (const listener of this.listeners) {
      try {
        await invoke(listener)
      } catch (err: any) {
        this.logger.error(`通知监听器 ${hookName} 失败 (ref=${ref}): ${err?.message}`, err?.stack)
      }
    }
  }
}

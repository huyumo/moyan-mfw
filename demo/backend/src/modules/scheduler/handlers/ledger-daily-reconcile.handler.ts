/**
 * @fileoverview 账本每日对账任务处理器
 * @description 演示账本对账能力对接 extension-scheduler（README 官方模式落地）：
 * 业务方实现 ScheduledTaskHandler 并在构造函数 TaskRegistry.register(this) 自注册，
 * 定时触发 LedgerReconcileService.runAll（内部自动走 LEDGER_LOCK 互斥 + 差异事件通知）
 *
 * 手动触发：POST /api/ext/scheduler/tasks/ledger-daily-reconcile/trigger
 */

import { Injectable } from '@nestjs/common'
import {
  TaskRegistry,
  type ScheduledTaskHandler,
  type TaskExecutionContext,
} from 'moyan-mfw-extension-scheduler/backend'
import { TaskTypeDict } from 'moyan-mfw-extension-scheduler/shared'
import { LedgerReconcileService } from 'moyan-mfw-extension-ledger/backend'

@Injectable()
export class LedgerDailyReconcileHandler implements ScheduledTaskHandler {
  readonly taskCode = 'ledger-daily-reconcile'
  readonly taskName = '账本每日对账'
  readonly taskType = TaskTypeDict.CRON
  readonly defaultCron = '0 0 3 * * *'
  readonly defaultTimeoutSeconds = 300
  readonly description = '每日 3 点执行账本恒等式对账（LedgerReconcileService.runAll）'

  constructor(
    private readonly registry: TaskRegistry,
    private readonly reconcile: LedgerReconcileService,
  ) {
    this.registry.register(this)
  }

  async execute(ctx: TaskExecutionContext) {
    const result = await this.reconcile.runAll('scheduler')
    return {
      summary: `对账完成：${result.totalAccounts} 个账户，${result.diffCount} 个差异`,
      data: result,
    }
  }
}

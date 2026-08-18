/**
 * @fileoverview 对账服务 - 能力提供（非调度），定时由业务方对接 extension-scheduler
 * @description 恒等式校验 + 差异报告 + 增量修复（原子写调整分录 + 复验）
 *
 * README 对接示例（extension-scheduler）：
 *   @Injectable()
 *   export class LedgerDailyReconcileHandler implements ScheduledTaskHandler {
 *     taskCode = 'ledger-daily-reconcile'
 *     defaultCron = '0 3 * * *'
 *     constructor(private readonly reconcile: LedgerReconcileService) {}
 *     async execute() { await this.reconcile.runAll() }
 *   }
 */

import { Injectable, Inject, Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { LEDGER_STORAGE, LEDGER_LOCK, LEDGER_NOTIFIER } from '../spi/interfaces'
import type { ILedgerStorage, ILedgerLock, ILedgerNotifier } from '../spi/interfaces'

@Injectable()
export class LedgerReconcileService {
  private readonly logger = new Logger(LedgerReconcileService.name)

  constructor(
    @Inject(LEDGER_STORAGE) private readonly storage: ILedgerStorage,
    @Inject(LEDGER_LOCK) private readonly lock: ILedgerLock,
    @Inject(LEDGER_NOTIFIER) private readonly notifier: ILedgerNotifier,
  ) {}

  /** 全量对账（手动触发或外部调度） */
  async runAll(triggerBy?: string): Promise<{ reportId: string; totalAccounts: number; diffCount: number }> {
    // 对账互斥（防多实例/手动+定时并发）
    const lockToken = await this.lock.tryLock('ledger:reconcile', 300)
    if (!lockToken) throw new Error('对账正在进行中，请稍后')

    try {
      const { totalAccounts, diffs } = await this.storage.computeReconcileDiffs()
      const reportId = randomUUID()

      // 写报告（通过 storage 的 dataSource 落库；此处简化用 entity manager）
      // 注：报告实体由 module forFeature 注册，此处直接用 storage.ctx 落库
      // status：1=差异待处理（有差异账户，等人工 applyFix）；2=已处理（无差异，无需处理）
      const report = { id: reportId, triggerType: 1, triggerBy: triggerBy ?? null, totalAccounts, diffCount: diffs.length, diffs, status: diffs.length > 0 ? 1 : 2 }
      await this.persistReport(report)

      if (diffs.length > 0) {
        await this.notifier.emitReconcileDiff({
          reportId,
          diffCount: diffs.length,
          diffs: diffs.map((d) => ({ accountId: d.accountId, diff: d.diff })),
          triggeredAt: new Date(),
        })
        this.logger.warn(`对账完成：${diffs.length} 个账户有差异（reportId=${reportId}）`)
      } else {
        this.logger.log(`对账完成：${totalAccounts} 个账户全部平衡（reportId=${reportId}）`)
      }
      return { reportId, totalAccounts, diffCount: diffs.length }
    } finally {
      await this.lock.unlock('ledger:reconcile', lockToken)
    }
  }

  /** 单账户对账 */
  async runAccount(accountId: string): Promise<{ balanced: boolean; diff: string }> {
    const { diffs } = await this.storage.computeReconcileDiffs([accountId])
    if (diffs.length === 0) return { balanced: true, diff: '0' }
    return { balanced: false, diff: diffs[0].diff }
  }

  /** 对账报告分页（管理页查看） */
  async queryReports(filter: { status?: number; page?: number; pageSize?: number }) {
    return this.storage.queryReports(filter)
  }

  /**
   * 增量修复（人工确认后执行）
   * - 先锁账户行 -> 重读 Σ -> INSERT 调整分录 原子执行 -> 复验
   * - 大额 diff 只告警转人工
   * - 修复成功后把包含该账户差异的报告标记为已处理（status=2）
   */
  async applyFix(accountId: string, operator?: { id?: string; text?: string }): Promise<{ fixed: boolean; diff: string }> {
    const result = await this.storage.applyFix(accountId, operator)
    if (!result.fixed) {
      this.logger.error(`修复失败或需人工介入: account=${accountId}, diff=${result.diff}`)
      return result
    }
    // 联动：包含该账户差异的待处理报告置为已处理（SQL 匹配报告 diffs JSON 中的 accountId）
    await this.markReportsHandled(accountId)
    return result
  }

  /** 标记包含指定账户差异的报告为已处理（diffs JSON 数组按 accountId 匹配） */
  private async markReportsHandled(accountId: string): Promise<void> {
    const storage = this.storage as any
    if (!storage?.ctx?.reportRepo) return
    const repo = storage.ctx.reportRepo()
    try {
      await repo
        .createQueryBuilder()
        .update()
        .set({ status: 2 })
        .where(`status = 1 AND JSON_CONTAINS(diffs, JSON_OBJECT('accountId', :accountId))`, { accountId })
        .execute()
    } catch (err: any) {
      this.logger.warn(`报告状态联动更新失败（不影响修复结果）: ${err?.message}`)
    }
  }

  /** 持久化报告（通过 storage context） */
  private async persistReport(report: any): Promise<void> {
    // TypeOrmLedgerStorage 暴露 ctx；其他实现需自行扩展
    const storage = this.storage as any
    if (storage?.ctx) {
      const repo = storage.ctx.reportRepo()
      const entity = repo.create({
        id: report.id,
        triggerType: report.triggerType,
        triggerBy: report.triggerBy,
        totalAccounts: report.totalAccounts,
        diffCount: report.diffCount,
        diffs: report.diffs,
        status: report.status,
        operatorId: null,
        notes: null,
      })
      await repo.save(entity)
    }
  }
}

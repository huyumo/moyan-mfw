/**
 * @fileoverview 入账域存储：认领 + 入账事务（末位 claim_token CAS）+ 失败回退 + 取消（按桶分支）
 *
 * 核心正确性协议（四路评审修正）：
 *   1. 认领：PENDING->POSTING + claim_token + claim_at，影响 0 行=已被处理（XACK 跳过）
 *   2. 入账事务：账户按 id 排序固定顺序 UPDATE 防死锁；末位 claim_token CAS（POSTING->POSTED），0 行=已被接管->整体回滚
 *   3. 失败回退：带 claim_token 条件，0 行=已被接管->直接放弃（不重试、不重入队）
 *   4. 取消：按 hold_type 分桶回滚预占（PENDING_OUT / FROZEN）
 */

import { Injectable } from '@nestjs/common'
import type { EntityManager } from 'typeorm'
import {
  PostStatusDict,
  HoldTypeDict,
  DirectionDict,
} from 'moyan-mfw-extension-ledger/shared'
import { StorageContext } from './storage-context'
import { parseAmount } from '../../../services/amount.util'
import { generateEntryNo } from '../../../services/id-generator'
import { toTransferView } from './view.mapper'
import type {
  ClaimResult,
  PostResult,
  ScavengeItem,
  ScavenigeResult,
} from '../../interfaces'

const DIR = DirectionDict as unknown as { DEBIT: 1; CREDIT: 2 }

@Injectable()
export class PostingStorage {
  constructor(private readonly ctx: StorageContext) {}

  /** 认领（PENDING->POSTING + claim_token + claim_at，影响 0 行=已被处理） */
  async claimForPosting(transferNo: string, claimToken: string, manager?: EntityManager): Promise<ClaimResult> {
    const em = manager ?? this.ctx.dataSource.manager
    const result = await em
      .createQueryBuilder()
      .update(this.ctx.transferRepo(em).target)
      .set({
        postStatus: PostStatusDict.POSTING,
        claimToken,
        claimAt: () => 'NOW()',
      })
      .where(
        'transferNo = :no AND postStatus = :pending AND (nextRetryAt IS NULL OR nextRetryAt <= NOW())',
        { no: transferNo, pending: PostStatusDict.PENDING },
      )
      .execute()
    if (result.affected === 0) return { affected: 0 }
    const transfer = await this.ctx.transferRepo(em).findOne({ where: { transferNo } })
    return { affected: 1, transfer: toTransferView(transfer, this.ctx.options.bizExtMappings) }
  }

  /**
   * 入账事务（账户按 id 排序锁序防死锁 + 末位 claim_token CAS）
   * @returns success=false 且无 error = fencing 失败（已被接管，放弃）
   */
  async postTransfer(transferNo: string, claimToken: string, manager?: EntityManager): Promise<PostResult> {
    return this.ctx.tx(async (m) => {
      const em = manager ?? m
      const transfer = await this.ctx.transferRepo(em).findOne({ where: { transferNo } })
      if (!transfer) return { success: false, error: '交易单不存在' }

      // 复验内容（防 JSON 被 DB 直改/制单 bug）
      const validationError = this.validateForPosting(transfer)
      if (validationError) return { success: false, error: validationError }

      const amount = BigInt(transfer.amount)
      // 涉及账户去重 + 按 id 排序（锁顺序化防死锁）
      const accountIds = [transfer.fromAccountId, ...transfer.toAccounts.map((t: any) => t.account)]
      const sortedIds = [...new Set(accountIds)].sort()

      // 锁定涉及的账户行（SELECT ... FOR UPDATE，按排序顺序）
      // 注意：em.query 只支持 ? 位置参数（不支持 :named）
      const placeholders = sortedIds.map(() => '?').join(',')
      const accounts: any[] = await em.query(
        `SELECT id, balance, frozen, pendingOut, totalIncome, totalOutcome, currency FROM ext_ledger_account WHERE id IN (${placeholders}) AND deleteAt IS NULL FOR UPDATE`,
        sortedIds,
      )
      const accountMap = new Map(accounts.map((a) => [a.id, a]))

      const fromAcct = accountMap.get(transfer.fromAccountId)
      if (!fromAcct) return { success: false, error: '转出方账户不存在或已删除' }

      // 出账方：按 hold_type 释放占用
      const releaseField = transfer.holdType === HoldTypeDict.FROZEN ? 'frozen' : 'pendingOut'
      const releaseResult = await em.query(
        `UPDATE ext_ledger_account SET ${releaseField} = ${releaseField} - ?, totalOutcome = totalOutcome + ? WHERE id = ? AND ${releaseField} >= ? AND deleteAt IS NULL`,
        [amount.toString(), amount.toString(), transfer.fromAccountId, amount.toString()],
      )
      if (releaseResult.affectedRows === 0) {
        return { success: false, error: `出账方占用不足: ${transfer.fromAccountId}（${releaseField}=${fromAcct[releaseField]}）` }
      }

      // 出账方分录（贷方，signed_amount = -amount）
      const fromBalanceBefore = fromAcct.balance
      const fromBalanceAfter = fromBalanceBefore // 出账方 balance 在预占时已减，入账时不变
      await this.ctx.entryRepo(em).insert({
        accountId: transfer.fromAccountId,
        entryNo: generateEntryNo(transferNo, DIR.CREDIT, 1),
        transferNo,
        direction: DIR.CREDIT,
        signedAmount: `-${amount.toString()}`,
        balanceBefore: fromBalanceBefore.toString(),
        balanceAfter: fromBalanceAfter.toString(),
        currency: transfer.currency, // 币种（金额展示/格式化依赖）
        extra: { holdType: transfer.holdType },
      } as any)

      // 各入账方：balance += amt, totalIncome += amt；插分录（借方，+amt）
      let seq = 1
      for (const target of transfer.toAccounts) {
        const toAcct = accountMap.get(target.account)
        if (!toAcct) return { success: false, error: `收款方账户不存在: ${target.account}` }
        if (toAcct.currency !== transfer.currency) {
          return { success: false, error: `币种不一致: ${target.account}` }
        }
        const amt = BigInt(target.amount)
        const updateResult = await em.query(
          `UPDATE ext_ledger_account SET balance = balance + ?, totalIncome = totalIncome + ? WHERE id = ? AND deleteAt IS NULL`,
          [amt.toString(), amt.toString(), target.account],
        )
        if (updateResult.affectedRows === 0) {
          return { success: false, error: `入账方更新失败: ${target.account}` }
        }
        // 读回新 balance（同事务内读自己写）
        const [updated] = await em.query(`SELECT balance FROM ext_ledger_account WHERE id = ?`, [target.account])
        const afterBal = BigInt(updated.balance)
        await this.ctx.entryRepo(em).insert({
          accountId: target.account,
          entryNo: generateEntryNo(transferNo, DIR.DEBIT, seq++),
          transferNo,
          direction: DIR.DEBIT,
          signedAmount: amt.toString(),
          balanceBefore: (afterBal - amt).toString(),
          balanceAfter: afterBal.toString(),
          currency: transfer.currency, // 币种（金额展示/格式化依赖）
          extra: null,
        } as any)
      }

      // 末位 fencing CAS（整个设计正确性基石）：POSTING->POSTED + claim_token 校验
      const fenceResult = await em.query(
        `UPDATE ext_ledger_transfer SET postStatus = ?, claimToken = NULL WHERE transferNo = ? AND postStatus = ? AND claimToken = ?`,
        [PostStatusDict.POSTED, transferNo, PostStatusDict.POSTING, claimToken],
      )
      if (fenceResult.affectedRows === 0) {
        // 已被孤儿重置接管 -> 整体回滚
        return { success: false }
      }
      return { success: true }
    })
  }

  /** 复验单内容（防 DB 直改） */
  private validateForPosting(transfer: any): string | null {
    if (!transfer.toAccounts || transfer.toAccounts.length === 0) return '收款方为空'
    let sum = 0n
    const set = new Set<string>()
    for (const t of transfer.toAccounts) {
      if (t.account === transfer.fromAccountId) return '转出方不能同时是收款方'
      if (set.has(t.account)) return `收款方重复: ${t.account}`
      set.add(t.account)
      sum += BigInt(t.amount)
    }
    if (sum !== BigInt(transfer.amount)) return `收款方合计 ${sum} 不等于 ${transfer.amount}`
    return null
  }

  /**
   * 失败回退（POSTING->PENDING + retryCount+1 + nextRetryAt 退避）
   * 带 claim_token 条件，0 行=已被接管->直接放弃
   */
  async revertToPending(
    transferNo: string,
    claimToken: string,
    retryCount: number,
    nextRetryAt: Date,
    error: string,
    manager?: EntityManager,
  ): Promise<{ affected: number }> {
    const em = manager ?? this.ctx.dataSource.manager
    const result = await em.query(
      `UPDATE ext_ledger_transfer SET postStatus = ?, claimToken = NULL, claimAt = NULL, retryCount = ?, nextRetryAt = ?, lastError = ? WHERE transferNo = ? AND postStatus = ? AND claimToken = ?`,
      [PostStatusDict.PENDING, retryCount, nextRetryAt, error, transferNo, PostStatusDict.POSTING, claimToken],
    )
    return { affected: result.affectedRows ?? 0 }
  }

  /** 标记 FAILED（重试耗尽，带 claim_token 条件） */
  async markFailed(transferNo: string, claimToken: string, error: string, manager?: EntityManager): Promise<{ affected: number }> {
    const em = manager ?? this.ctx.dataSource.manager
    const result = await em.query(
      `UPDATE ext_ledger_transfer SET postStatus = ?, claimToken = NULL, claimAt = NULL, lastError = ? WHERE transferNo = ? AND postStatus = ? AND claimToken = ?`,
      [PostStatusDict.FAILED, error, transferNo, PostStatusDict.POSTING, claimToken],
    )
    return { affected: result.affectedRows ?? 0 }
  }

  /**
   * 取消（FAILED->CANCELLED + 按 hold_type 分桶回滚预占）
   * 0 行告警（状态已翻但资金未动）
   */
  async cancel(transferNo: string, operator?: { id?: string; text?: string }, manager?: EntityManager): Promise<{ affected: number; reserveAffected: number }> {
    return this.ctx.tx(async (m) => {
      const em = manager ?? m
      const transfer = await this.ctx.transferRepo(em).findOne({ where: { transferNo } })
      if (!transfer) return { affected: 0, reserveAffected: 0 }

      // FAILED->CANCELLED 条件更新
      const result = await em.query(
        `UPDATE ext_ledger_transfer SET postStatus = ? WHERE transferNo = ? AND postStatus = ?`,
        [PostStatusDict.CANCELLED, transferNo, PostStatusDict.FAILED],
      )
      const affected = result.affectedRows ?? 0
      if (affected === 0) return { affected: 0, reserveAffected: 0 }

      // 按 hold_type 分桶回滚预占
      const releaseField = transfer.holdType === HoldTypeDict.FROZEN ? 'frozen' : 'pendingOut'
      const rollback = await em.query(
        `UPDATE ext_ledger_account SET balance = balance + ?, ${releaseField} = ${releaseField} - ? WHERE id = ? AND ${releaseField} >= ? AND deleteAt IS NULL`,
        [transfer.amount, transfer.amount, transfer.fromAccountId, transfer.amount],
      )
      if (rollback.affectedRows === 0) {
        console.error(`[LEDGER] 取消回滚 0 行告警: transferNo=${transferNo}, account=${transfer.fromAccountId}, field=${releaseField}, amt=${transfer.amount}`)
      }
      return { affected, reserveAffected: rollback.affectedRows ?? 0 }
    })
  }

  /** 人工重推（FAILED/CANCELLED->PENDING + 重置 retry/next_retry/claim） */
  async repost(transferNo: string, manager?: EntityManager): Promise<{ affected: number }> {
    const em = manager ?? this.ctx.dataSource.manager
    const result = await em.query(
      `UPDATE ext_ledger_transfer SET postStatus = ?, retryCount = 0, nextRetryAt = NULL, claimToken = NULL, claimAt = NULL, lastError = NULL WHERE transferNo = ? AND postStatus IN (?, ?)`,
      [PostStatusDict.PENDING, transferNo, PostStatusDict.FAILED, PostStatusDict.CANCELLED],
    )
    return { affected: result.affectedRows ?? 0 }
  }

  /** 批量重推（≤1000） */
  async batchRepost(transferNos: string[], manager?: EntityManager): Promise<{ affected: number }> {
    if (transferNos.length === 0) return { affected: 0 }
    if (transferNos.length > 1000) throw new Error('批量重推单次不能超过 1000')
    const em = manager ?? this.ctx.dataSource.manager
    const placeholders = transferNos.map((_, i) => `:n${i}`).join(',')
    const params: Record<string, any> = {}
    transferNos.forEach((n, i) => (params[`n${i}`] = n))
    const result = await em.query(
      `UPDATE ext_ledger_transfer SET postStatus = ?, retryCount = 0, nextRetryAt = NULL, claimToken = NULL, claimAt = NULL, lastError = NULL WHERE transferNo IN (${placeholders}) AND postStatus IN (?, ?)`,
      [...transferNos, PostStatusDict.PENDING, PostStatusDict.FAILED, PostStatusDict.CANCELLED],
    )
    return { affected: result.affectedRows ?? 0 }
  }

  /** 兜底扫描：PENDING 入队超时 + POSTING 孤儿 */
  async scavenge(now: Date, enqueueTimeoutMs: number, orphanTimeoutMs: number, repushThrottleMs: number, limit: number, manager?: EntityManager): Promise<ScavenigeResult> {
    const em = manager ?? this.ctx.dataSource.manager
    const enqueueCutoff = new Date(now.getTime() - enqueueTimeoutMs)
    const orphanCutoff = new Date(now.getTime() - orphanTimeoutMs)
    const repushCutoff = new Date(now.getTime() - repushThrottleMs)

    // PENDING 入队超时（nextRetryAt 已到期 + lastPushAt 早于节流阈值或为空）
    const pendingTimeout: ScavengeItem[] = await em.query(
      `SELECT transferNo FROM ext_ledger_transfer WHERE postStatus = ? AND (nextRetryAt IS NULL OR nextRetryAt <= NOW()) AND (lastPushAt IS NULL OR lastPushAt < ?) ORDER BY createdAt ASC LIMIT ?`,
      [PostStatusDict.PENDING, repushCutoff, Math.floor(limit / 2)],
    ).then((rows: any[]) => rows.map((r) => ({ transferNo: r.transferNo, reason: 'pending_timeout' as const })))

    // POSTING 孤儿（claim_at 早于孤儿阈值）
    const orphans: ScavengeItem[] = await em.query(
      `SELECT transferNo FROM ext_ledger_transfer WHERE postStatus = ? AND claimAt < ? ORDER BY claimAt ASC LIMIT ?`,
      [PostStatusDict.POSTING, orphanCutoff, Math.floor(limit / 2)],
    ).then((rows: any[]) => rows.map((r) => ({ transferNo: r.transferNo, reason: 'orphan' as const })))

    return { pendingTimeout, orphans }
  }

  /** 孤儿重置（POSTING->PENDING + claim_token=NULL，条件 claim_at < 超时） */
  async resetOrphans(transferNos: string[], manager?: EntityManager): Promise<{ affected: number }> {
    if (transferNos.length === 0) return { affected: 0 }
    const em = manager ?? this.ctx.dataSource.manager
    const placeholders = transferNos.map(() => '?').join(',')
    const result = await em.query(
      `UPDATE ext_ledger_transfer SET postStatus = ?, claimToken = NULL, claimAt = NULL WHERE transferNo IN (${placeholders}) AND postStatus = ?`,
      [PostStatusDict.PENDING, ...transferNos, PostStatusDict.POSTING],
    )
    return { affected: result.affectedRows ?? 0 }
  }
}

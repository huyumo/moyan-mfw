/**
 * @fileoverview 冲正域存储：冲正（同步事务全流程）+ 冲正记录查询
 * @description 冲正独立落表（不入 ext_ledger_transfer），不动累计转入/转出：
 *
 * 冲正协议（四路评审精神）：
 *   1. 同步事务完成（低频管理操作）：CAS 标记原单 → 账户排序锁 → 余额校验 → 动 balance
 *      → 写 isReversal=1 分录（挂原单 transferNo）→ 插冲正记录 → 原单标记冲正单号
 *   2. 余额不足（任一收款方）→ 整体抛错回滚（含原单标记，全有或全无）
 *   3. 防双冲正：原单 reversedFromTransferNo CAS（0 行=已被冲正）+ ext_ledger_reversal.originalTransferNo 唯一兜底
 *   4. 幂等：bizRef+bizType 唯一命中返回已有记录（created=false）
 *   5. 不更新 totalIncome/totalOutcome（资金回流非新增收支）；不入 ext_ledger_transfer（制单条数不受影响）
 */

import { Injectable } from '@nestjs/common'
import type { EntityManager } from 'typeorm'
import {
  ReversalStatusDict,
  PostStatusDict,
  DirectionDict,
  type ReverseTransferInput,
  type ReversalView,
} from 'moyan-mfw-extension-ledger/shared'
import { StorageContext } from './storage-context'
import { generateReversalNo, generateEntryNo } from '../../../services/id-generator'
import { LedgerTransfer as LedgerTransferEntityRef } from '../../../entities'
import { InsufficientBalanceError, InvalidTransferError } from './transfer.storage'
import type { ReversalQueryFilter } from '../../interfaces'

const DIR = DirectionDict as unknown as { DEBIT: 1; CREDIT: 2 }

@Injectable()
export class ReversalStorage {
  constructor(private readonly ctx: StorageContext) {}

  /**
   * 冲正（同步事务完成；原单须 POSTED 且未冲正；全额冲正全部收款方）
   * - 幂等：bizRef+bizType 命中返回已有冲正记录（created=false）
   * - 原单各收款方将其收款金额各自退回原转出方（资金回流）
   * - 冲正腿分录 isReversal=1 挂原单 transferNo（entryNo 用冲正单号生成避免重名）
   * - 不更新 totalIncome/totalOutcome；不入 ext_ledger_transfer
   */
  async createReversal(
    input: ReverseTransferInput,
    maker?: { id?: string; text?: string },
    manager?: EntityManager,
  ): Promise<{ reversal: ReversalView; created: boolean }> {
    return this.ctx.tx(async (m) => {
      const em = manager ?? m
      const reversalRepo = this.ctx.reversalRepo(em)
      const transferRepo = this.ctx.transferRepo(em)

      // 1. 幂等
      const existing = await reversalRepo.findOne({ where: { bizRef: input.bizRef, bizType: input.bizType } })
      if (existing) return { reversal: toReversalView(existing), created: false }

      // 2. 加载原单 + 前置校验
      const original = await transferRepo.findOne({ where: { transferNo: input.originalTransferNo } })
      if (!original) throw new InvalidTransferError(`原交易单不存在: ${input.originalTransferNo}`)
      if (original.postStatus !== PostStatusDict.POSTED) {
        throw new InvalidTransferError(`原单未入账，不可冲正（当前状态: ${original.postStatus}）`)
      }
      if (original.reversedFromTransferNo) {
        throw new InvalidTransferError(`原单已被冲正（冲正单号 ${original.reversedFromTransferNo}）`)
      }

      const reversalNo = generateReversalNo()

      // 3. 原单 CAS 标记（防双冲正；影响 0 行=并发方已冲正/状态已变）
      const mark = await em
        .createQueryBuilder()
        .update(LedgerTransferEntityRef)
        .set({ reversedFromTransferNo: reversalNo })
        .where('transferNo = :no AND postStatus = :posted AND reversedFromTransferNo IS NULL', {
          no: input.originalTransferNo,
          posted: PostStatusDict.POSTED,
        })
        .execute()
      if (mark.affected === 0) {
        const refetched = await transferRepo.findOne({ where: { transferNo: input.originalTransferNo } })
        if (refetched?.reversedFromTransferNo) {
          throw new InvalidTransferError(`原单已被冲正（冲正单号 ${refetched.reversedFromTransferNo}）`)
        }
        throw new InvalidTransferError(`原单状态不符，冲正失败`)
      }

      // 4. 复验原单内容（防 JSON 被 DB 直改/制单 bug）
      const validationError = validateReversalContent(original)
      if (validationError) throw new InvalidTransferError(validationError)

      const amount = BigInt(original.amount)
      const toAccounts: { account: string; amount: string }[] = original.toAccounts

      // 5. 账户排序锁（防死锁，对齐入账协议）
      const accountIds = [original.fromAccountId, ...toAccounts.map((t) => t.account)]
      const sortedIds = [...new Set(accountIds)].sort()
      const placeholders = sortedIds.map(() => '?').join(',')
      const accounts: any[] = await em.query(
        `SELECT id, balance, currency FROM ext_ledger_account WHERE id IN (${placeholders}) AND deleteAt IS NULL FOR UPDATE`,
        sortedIds,
      )
      const accountMap = new Map(accounts.map((a) => [a.id, a]))

      // 6. 各收款方退回（balance -= amt，不更新 totalOutcome）；贷方分录（-amt，isReversal=1）
      let seq = 1
      for (const target of toAccounts) {
        const payer = accountMap.get(target.account)
        if (!payer) throw new InvalidTransferError(`收款方账户不存在或已删除: ${target.account}`)
        if (payer.currency !== original.currency) {
          throw new InvalidTransferError(`币种不一致: ${target.account}`)
        }
        const amt = BigInt(target.amount)
        if (BigInt(payer.balance) < amt) {
          throw new InsufficientBalanceError(
            `收款方账户余额不足，无法全额冲正: ${target.account}（需退回 ${amt}，可用 ${payer.balance}）`,
          )
        }
        const balanceBefore = BigInt(payer.balance)
        const balanceAfter = balanceBefore - amt
        await em.query(
          `UPDATE ext_ledger_account SET balance = balance - ? WHERE id = ? AND balance >= ? AND deleteAt IS NULL`,
          [amt.toString(), target.account, amt.toString()],
        )
        await this.ctx.entryRepo(em).insert({
          accountId: target.account,
          entryNo: generateEntryNo(reversalNo, DIR.CREDIT, seq++),
          transferNo: original.transferNo,
          direction: DIR.CREDIT,
          signedAmount: `-${amt.toString()}`,
          balanceBefore: balanceBefore.toString(),
          balanceAfter: balanceAfter.toString(),
          currency: original.currency,
          extra: { reversalNo },
          isReversal: 1,
        } as any)
      }

      // 7. 原转出方收到退回（balance += amount，不更新 totalIncome）；借方分录（+amount，isReversal=1）
      const receiver = accountMap.get(original.fromAccountId)
      if (!receiver) throw new InvalidTransferError(`原转出方账户不存在或已删除: ${original.fromAccountId}`)
      if (receiver.currency !== original.currency) {
        throw new InvalidTransferError(`币种不一致: ${original.fromAccountId}`)
      }
      const receiverBefore = BigInt(receiver.balance)
      const receiverAfter = receiverBefore + amount
      await em.query(
        `UPDATE ext_ledger_account SET balance = balance + ? WHERE id = ? AND deleteAt IS NULL`,
        [amount.toString(), original.fromAccountId],
      )
      await this.ctx.entryRepo(em).insert({
        accountId: original.fromAccountId,
        entryNo: generateEntryNo(reversalNo, DIR.DEBIT, 1),
        transferNo: original.transferNo,
        direction: DIR.DEBIT,
        signedAmount: amount.toString(),
        balanceBefore: receiverBefore.toString(),
        balanceAfter: receiverAfter.toString(),
        currency: original.currency,
        extra: { reversalNo },
        isReversal: 1,
      } as any)

      // 8. 插冲正记录
      const reversal = reversalRepo.create({
        reversalNo,
        originalTransferNo: original.transferNo,
        bizRef: input.bizRef,
        bizType: input.bizType,
        currency: original.currency,
        amount: original.amount,
        fromAccountId: original.fromAccountId,
        toAccounts,
        status: ReversalStatusDict.POSTED,
        description: input.description ?? `冲正 ${original.transferNo}`,
        makerId: input.makerId ?? maker?.id ?? null,
        makerText: input.makerText ?? maker?.text ?? null,
        extra: input.extra ?? null,
      } as any)
      await reversalRepo.save(reversal)

      return { reversal: toReversalView(reversal), created: true }
    })
  }

  /** 查冲正记录 */
  async getReversal(reversalNo: string, manager?: EntityManager): Promise<ReversalView | null> {
    const em = manager ?? this.ctx.dataSource.manager
    const row = await this.ctx.reversalRepo(em).findOne({ where: { reversalNo } })
    return row ? toReversalView(row) : null
  }

  /** 冲正记录分页 */
  async queryReversals(filter: ReversalQueryFilter, manager?: EntityManager): Promise<{ items: ReversalView[]; total: number }> {
    const em = manager ?? this.ctx.dataSource.manager
    const qb = this.ctx.reversalRepo(em).createQueryBuilder('r')
    if (filter.reversalNo) qb.andWhere('r.reversalNo = :reversalNo', { reversalNo: filter.reversalNo })
    if (filter.originalTransferNo) qb.andWhere('r.originalTransferNo = :originalTransferNo', { originalTransferNo: filter.originalTransferNo })
    if (filter.bizType) qb.andWhere('r.bizType = :bizType', { bizType: filter.bizType })
    if (filter.fromAccountId) qb.andWhere('r.fromAccountId = :fromAccountId', { fromAccountId: filter.fromAccountId })
    if (filter.startDate) qb.andWhere('r.createdAt >= :startDate', { startDate: filter.startDate })
    if (filter.endDate) qb.andWhere('r.createdAt < :endDate', { endDate: filter.endDate })
    qb.orderBy('r.createdAt', 'DESC')
    const page = filter.page ?? 1
    const pageSize = filter.pageSize ?? 20
    qb.skip((page - 1) * pageSize).take(pageSize)
    const [items, total] = await qb.getManyAndCount()
    return { items: items.map((i: any) => toReversalView(i)), total }
  }
}

/** 复验原单内容（冲正前防 DB 直改/制单 bug） */
function validateReversalContent(transfer: any): string | null {
  if (!transfer.toAccounts || transfer.toAccounts.length === 0) return '原单收款方为空'
  let sum = 0n
  const set = new Set<string>()
  for (const t of transfer.toAccounts) {
    if (t.account === transfer.fromAccountId) return '原单转出方不能同时是收款方'
    if (set.has(t.account)) return `原单收款方重复: ${t.account}`
    set.add(t.account)
    sum += BigInt(t.amount)
  }
  if (sum !== BigInt(transfer.amount)) return `原单收款方合计 ${sum} 不等于 ${transfer.amount}`
  return null
}

/** 冲正实体 → ReversalView */
function toReversalView(entity: any): ReversalView {
  return entity as ReversalView
}

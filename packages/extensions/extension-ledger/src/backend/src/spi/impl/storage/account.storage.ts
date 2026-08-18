/**
 * @fileoverview 账户域存储：开户（幂等 + 同步入账）
 * @description 开户初始余额同步入账（不走队列），避免窗口期内转账报余额不足
 */

import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { AuditStatusDict, PostStatusDict, HoldTypeDict, TransferModeDict, DirectionDict } from 'moyan-mfw-extension-ledger/shared'
import { StorageContext } from './storage-context'
import { parseAmount } from '../../../services/amount.util'
import { generateTransferNo, generateEntryNo } from '../../../services/id-generator'
import { toAccountView } from './view.mapper'
import type { OpenAccountInput } from '../../interfaces'
import type { EntityManager } from 'typeorm'

const DIR = { DEBIT: DirectionDict.DEBIT, CREDIT: DirectionDict.CREDIT } as const

/** MySQL 唯一键冲突错误码（ER_DUP_ENTRY） */
const ER_DUP_ENTRY = 1062

@Injectable()
export class AccountStorage {
  constructor(private readonly ctx: StorageContext) {}

  /**
   * 开户（幂等 + 并发安全）
   * - holderId+holderType+tag+currency 命中 -> 返回已有账户
   * - 并发窗口（两进程同时未命中）-> 唯一键冲突捕获后重查返回
   * - 初始余额 > 0 -> 同步入账（balance=initial + 写「开户调整」交易单+分录），不走队列
   */
  async openAccount(input: OpenAccountInput, manager?: EntityManager) {
    const repo = this.ctx.accountRepo(manager)
    const existing = await repo.findOne({
      where: {
        holderId: input.holderId,
        holderType: input.holderType ?? 'system',
        tag: input.tag ?? 'default',
        currency: input.currency ?? 'CNY',
      } as any,
    })
    if (existing) return toAccountView(existing)

    const initial = input.initialBalance ? parseAmount(input.initialBalance, 'initialBalance') : 0n
    const account: any = repo.create({
      id: randomUUID(),
      sysAccountKey: input.sysAccountKey ?? null,
      holderId: input.holderId,
      holderType: input.holderType ?? 'system',
      tag: input.tag ?? 'default',
      currency: input.currency ?? 'CNY',
      balance: initial.toString(),
      frozen: '0',
      pendingOut: '0',
      totalIncome: initial.toString(),
      totalOutcome: '0',
      extra: input.extra ?? null,
    })
    try {
      await repo.save(account)
    } catch (err: any) {
      // 并发冲突：唯一键 uk_ledger_account_holder_tag_currency 兜底，重查返回
      if (err?.driverError?.errno === ER_DUP_ENTRY) {
        const winner = await repo.findOne({
          where: {
            holderId: input.holderId,
            holderType: input.holderType ?? 'system',
            tag: input.tag ?? 'default',
            currency: input.currency ?? 'CNY',
          } as any,
        })
        if (winner) return toAccountView(winner)
      }
      throw err
    }

    // 初始余额同步写「开户调整」分录（保证恒等式从零成立）
    if (initial > 0n) {
      const transferNo = generateTransferNo()
      const transferRepo = this.ctx.transferRepo(manager)
      await transferRepo.insert({
        transferNo,
        bizRef: `open-account:${account.id}`,
        bizType: 'ledger_open_account',
        fromAccountId: 'system',
        toAccounts: [{ account: account.id, amount: initial.toString() }],
        amount: initial.toString(),
        currency: account.currency,
        transferMode: TransferModeDict.ONE_TO_ONE,
        needReview: false,
        holdType: HoldTypeDict.PENDING_OUT,
        auditStatus: AuditStatusDict.APPROVED,
        postStatus: PostStatusDict.POSTED,
        associatedOrder: null,
        orderTable: null,
        retryCount: 0,
        claimToken: null,
        claimAt: null,
        nextRetryAt: null,
        lastPushAt: null,
        lastError: null,
        reversedFromTransferNo: null,
        description: `开户初始余额 ${account.holderId}/${account.tag}`,
        makerId: null,
        makerText: 'system',
        auditorId: null,
        auditorText: null,
        auditTime: null,
        auditNotes: null,
        extra: null,
      } as any)

      const entryRepo = this.ctx.entryRepo(manager)
      await entryRepo.insert({
        accountId: account.id,
        entryNo: generateEntryNo(transferNo, DIR.DEBIT, 1),
        transferNo,
        direction: DIR.DEBIT,
        signedAmount: initial.toString(),
        balanceBefore: '0',
        balanceAfter: initial.toString(),
        extra: { type: 'open_account' },
      } as any)
    }

    return toAccountView(account)
  }

  async getAccount(accountId: string, manager?: EntityManager) {
    const row = await this.ctx.accountRepo(manager).findOne({ where: { id: accountId } as any })
    return toAccountView(row)
  }

  async findAccount(holderId: string, holderType: string, tag: string, currency: string, manager?: EntityManager) {
    const row = await this.ctx.accountRepo(manager).findOne({
      where: { holderId, holderType, tag, currency } as any,
    })
    return toAccountView(row)
  }
}

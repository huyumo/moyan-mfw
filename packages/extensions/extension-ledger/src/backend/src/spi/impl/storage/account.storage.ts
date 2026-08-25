/**
 * @fileoverview 账户域存储：开户（幂等 + 同步入账 + 事务原子）
 * @description 开户初始余额同步入账（不走队列），避免窗口期内转账报余额不足；
 *   写账户 + 写 open_account 交易单 + 写期初分录整体包事务（②③失败回滚①，杜绝半截账户）
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

/** open_account 期初交易单幂等键（bizRef + bizType，对齐 uk_ledger_transfer_biz_ref） */
const OPEN_ACCOUNT_BIZ_TYPE = 'ledger_open_account'
const openAccountBizRef = (accountId: string) => `open-account:${accountId}`

@Injectable()
export class AccountStorage {
  constructor(private readonly ctx: StorageContext) {}

  /**
   * 开户（幂等 + 并发安全 + 事务原子）
   * - holderId+holderType+tag+currency 命中 -> 返回已有账户（并对历史半截账户自愈补期初流水）
   * - 并发窗口（两进程同时未命中）-> 唯一键冲突捕获后重查返回
   * - 初始余额 > 0 -> 同步入账（balance=initial + 写「开户调整」交易单+分录），不走队列
   * - 写账户 + 写交易单 + 写分录整体包 ctx.tx（②③失败回滚①，杜绝"有余额无流水"半截账户）
   */
  async openAccount(input: OpenAccountInput, manager?: EntityManager) {
    const em = manager ?? this.ctx.dataSource.manager
    const existing = await this.ctx.accountRepo(em).findOne({
      where: {
        holderId: input.holderId,
        holderType: input.holderType ?? 'system',
        tag: input.tag ?? 'default',
        currency: input.currency ?? 'CNY',
      } as any,
    })
    if (existing) {
      // 自愈：历史半截账户（有余额、缺 open_account 期初流水）幂等补齐
      await this.ensureOpeningEntry(existing.id, manager)
      return toAccountView(existing)
    }

    const initial = input.initialBalance ? parseAmount(input.initialBalance, 'initialBalance') : 0n

    const doOpen = async (tx: EntityManager) => {
      const repo = this.ctx.accountRepo(tx)
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
        // 并发冲突：唯一键 uk_ledger_account_holder_tag_currency 兜底，重查返回（并对半截账户自愈）
        if (err?.driverError?.errno === ER_DUP_ENTRY) {
          const winner = await repo.findOne({
            where: {
              holderId: input.holderId,
              holderType: input.holderType ?? 'system',
              tag: input.tag ?? 'default',
              currency: input.currency ?? 'CNY',
            } as any,
          })
          if (winner) {
            await this.ensureOpeningEntry(winner.id, tx)
            return winner
          }
        }
        throw err
      }

      // 初始余额同步写「开户调整」分录（保证恒等式从零成立）
      if (initial > 0n) {
        const transferNo = generateTransferNo()
        const transferRepo = this.ctx.transferRepo(tx)
        await transferRepo.insert({
          transferNo,
          bizRef: openAccountBizRef(account.id),
          bizType: OPEN_ACCOUNT_BIZ_TYPE,
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

        const entryRepo = this.ctx.entryRepo(tx)
        await entryRepo.insert({
          accountId: account.id,
          entryNo: generateEntryNo(transferNo, DIR.DEBIT, 1),
          transferNo,
          direction: DIR.DEBIT,
          signedAmount: initial.toString(),
          balanceBefore: '0',
          balanceAfter: initial.toString(),
          currency: account.currency, // 币种（与交易单一致，保证流水展示/恒等式口径自洽）
          extra: { type: 'open_account' },
        } as any)
      }

      return account
    }

    const account = manager ? await doOpen(manager) : await this.ctx.tx(doOpen)
    return toAccountView(account)
  }

  /**
   * 幂等补齐期初流水（自愈历史半截账户）
   * 历史版本 openAccount 非事务：账户行落库成功、期初流水写入失败会留下
   * "有余额、无 open_account 期初流水"的半截账户（对账恒等式从建户起不成立）。
   * 本方法按缺口补齐（signedAmount = balance+frozen+pendingOut − Σ(signed_amount)，
   * 无任何业务分录时即原初始余额）；幂等键 (bizRef='open-account:{id}', bizType='ledger_open_account')
   * 命中即跳过；并发安全（事务 + 账户行锁 + 唯一键兜底）。
   * @param manager 传入时复用外部事务（不做嵌套事务），否则自建事务
   */
  async ensureOpeningEntry(accountId: string, manager?: EntityManager): Promise<void> {
    // 快速路径：期初交易单已存在（幂等键点查，索引命中）-> 无需回补
    const em = manager ?? this.ctx.dataSource.manager
    const existed = await this.ctx.transferRepo(em).findOne({
      where: { bizRef: openAccountBizRef(accountId), bizType: OPEN_ACCOUNT_BIZ_TYPE } as any,
    })
    if (existed) return

    const doBackfill = async (tx: EntityManager) => {
      // 事务内重查（并发窗口：另一实例可能刚补齐）
      const again = await this.ctx.transferRepo(tx).findOne({
        where: { bizRef: openAccountBizRef(accountId), bizType: OPEN_ACCOUNT_BIZ_TYPE } as any,
      })
      if (again) return

      // 锁账户行（对齐 applyFix 的并发防护：缺口计算期间余额变化时保证一致）
      const [acct] = await tx.query(
        `SELECT id, balance, frozen, pendingOut, holderId, tag, currency FROM ext_ledger_account WHERE id = ? AND deleteAt IS NULL FOR UPDATE`,
        [accountId],
      )
      if (!acct) return
      const lhs = BigInt(acct.balance) + BigInt(acct.frozen) + BigInt(acct.pendingOut)
      if (lhs <= 0n) return // 无账面余额/冻结/在途，无需期初流水

      // 缺口 = 账面 − Σ(已有分录)；无期初分录时即原初始余额；缺口 ≤ 0 不处理（非缺失期初场景）
      const [sumRow] = await tx.query(`SELECT COALESCE(SUM(signedAmount), 0) AS s FROM ext_ledger_entry WHERE accountId = ?`, [accountId])
      const diff = lhs - BigInt(sumRow.s)
      if (diff <= 0n) return

      const transferNo = generateTransferNo()
      try {
        await this.ctx.transferRepo(tx).insert({
          transferNo,
          bizRef: openAccountBizRef(accountId),
          bizType: OPEN_ACCOUNT_BIZ_TYPE,
          fromAccountId: 'system',
          toAccounts: [{ account: accountId, amount: diff.toString() }],
          amount: diff.toString(),
          currency: acct.currency,
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
          description: `开户初始余额回补 ${acct.holderId}/${acct.tag}`,
          makerId: null,
          makerText: 'system',
          auditorId: null,
          auditorText: null,
          auditTime: null,
          auditNotes: null,
          extra: null,
        } as any)
      } catch (err: any) {
        // 并发已补齐（唯一键 uk_ledger_transfer_biz_ref）
        if (err?.driverError?.errno === ER_DUP_ENTRY) return
        throw err
      }

      await this.ctx.entryRepo(tx).insert({
        accountId,
        entryNo: generateEntryNo(transferNo, DIR.DEBIT, 1),
        transferNo,
        direction: DIR.DEBIT,
        signedAmount: diff.toString(),
        balanceBefore: '0',
        balanceAfter: diff.toString(),
        currency: acct.currency,
        extra: { type: 'open_account', backfilled: true },
      } as any)
    }

    if (manager) return doBackfill(manager)
    await this.ctx.tx(doBackfill)
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

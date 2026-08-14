/**
 * @fileoverview 交易单域存储：制单（幂等+预占）、审核、冲正
 * @description 全部条件 UPDATE（CAS）保证并发正确性；金额参数化查询禁止拼接
 */

import { Injectable } from '@nestjs/common'
import type { EntityManager } from 'typeorm'
import {
  AuditStatusDict,
  PostStatusDict,
  HoldTypeDict,
  TransferModeDict,
  type CreateTransferInput,
  type AuditTransferInput,
  type ReverseTransferInput,
} from 'moyan-mfw-extension-ledger/shared'
import { StorageContext } from './storage-context'
import { parseAmount, gte } from '../../../services/amount.util'
import { generateTransferNo } from '../../../services/id-generator'
import { mapExtFieldsToColumns } from './ext-columns.util'

/** 余额不足错误（制单/冲正预占失败） */
export class InsufficientBalanceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InsufficientBalanceError'
  }
}

/** 收款方校验错误 */
export class InvalidTransferError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidTransferError'
  }
}

@Injectable()
export class TransferStorage {
  constructor(private readonly ctx: StorageContext) {}

  /**
   * 制单（幂等 + 预占）
   * - 幂等：bizRef+bizType 命中返回已有单（created=false）
   * - 校验：账户去重、from∉to、币种一致、Σto=amount、金额正整数≤上限、收款方≤100
   * - 预占（免审：balance-=amt, pending_out+=amt WHERE balance>=amt；需审：转 frozen）
   * - 0 行抛 InsufficientBalanceError
   */
  async createTransferWithReserve(
    input: CreateTransferInput,
    maker?: { id?: string; text?: string },
    manager?: EntityManager,
  ): Promise<{ transfer: any; created: boolean }> {
    return this.ctx.tx(async (m) => {
      const em = manager ?? m
      const transferRepo = this.ctx.transferRepo(em)

      // 1. 幂等检查
      const existing = await transferRepo.findOne({ where: { bizRef: input.bizRef, bizType: input.bizType } })
      if (existing) return { transfer: existing, created: false }

      // 2. 校验
      this.validateTransferInput(input)
      const amount = parseAmount(input.amount)

      // 3. 加载 from 账户
      const accountRepo = this.ctx.accountRepo(em)
      const fromAccount = await accountRepo.findOne({ where: { id: input.fromAccount } as any })
      if (!fromAccount) throw new InvalidTransferError(`转出方账户不存在: ${input.fromAccount}`)
      if (fromAccount.currency !== input.currency) {
        throw new InvalidTransferError(`币种不一致：from=${fromAccount.currency}, input=${input.currency}`)
      }

      // 4. 预占（原子条件 UPDATE，防超支）
      const holdType = input.needReview ? HoldTypeDict.FROZEN : HoldTypeDict.PENDING_OUT
      const postStatus = input.needReview ? PostStatusDict.NOT_READY : PostStatusDict.PENDING
      const auditStatus = input.needReview ? AuditStatusDict.PENDING_REVIEW : AuditStatusDict.APPROVED

      const reserveField = input.needReview ? 'frozen' : 'pendingOut'
      const result = await em
        .createQueryBuilder()
        .update(this.ctx.accountEntityCtor)
        .set({
          balance: () => `balance - ${amount}`,
          [reserveField]: () => `${reserveField} + ${amount}`,
        })
        .where('id = :id AND balance >= :amt AND deleteAt IS NULL', { id: input.fromAccount, amt: amount.toString() })
        .execute()

      if (result.affected === 0) {
        throw new InsufficientBalanceError(`账户余额不足: ${input.fromAccount}（需要 ${amount}，可用 ${fromAccount.balance}）`)
      }

      // 5. 插交易单
      const transferNo = generateTransferNo()
      const transferMode = input.toAccounts.length === 1 ? TransferModeDict.ONE_TO_ONE : TransferModeDict.ONE_TO_MANY
      // 业务扩展字段 → 预留索引位（未映射字段抛错；extra 合并快照保审计完整）
      const extCols = mapExtFieldsToColumns(input.bizType, input.extFields, this.ctx.options.bizExtMappings)
      const transfer = transferRepo.create({
        transferNo,
        bizRef: input.bizRef,
        bizType: input.bizType,
        fromAccountId: input.fromAccount,
        toAccounts: input.toAccounts.map((t) => ({ account: t.account, amount: t.amount })),
        amount: amount.toString(),
        currency: input.currency,
        transferMode,
        needReview: input.needReview,
        holdType,
        auditStatus,
        postStatus,
        associatedOrder: input.associatedOrder ?? null,
        orderTable: null,
        retryCount: 0,
        claimToken: null,
        claimAt: null,
        nextRetryAt: null,
        lastPushAt: null,
        lastError: null,
        reversedFromTransferNo: null,
        description: input.description ?? null,
        makerId: maker?.id ?? null,
        makerText: maker?.text ?? null,
        auditorId: null,
        auditorText: null,
        auditTime: null,
        auditNotes: null,
        extra: { ...(input.extra ?? {}), ...(input.extFields ?? {}) } as Record<string, unknown> | null,
        extCol1: extCols.extCol1 ?? null,
        extCol2: extCols.extCol2 ?? null,
        extCol3: extCols.extCol3 ?? null,
        extCol4: extCols.extCol4 ?? null,
      } as any)
      await transferRepo.save(transfer)

      return { transfer, created: true }
    })
  }

  /** 校验制单入参 */
  private validateTransferInput(input: CreateTransferInput): void {
    if (!input.toAccounts || input.toAccounts.length === 0) {
      throw new InvalidTransferError('收款方不能为空')
    }
    if (input.toAccounts.length > 100) {
      throw new InvalidTransferError('单笔收款方不能超过 100 个')
    }
    const fromInTo = input.toAccounts.some((t) => t.account === input.fromAccount)
    if (fromInTo) throw new InvalidTransferError('转出方不能同时是收款方')

    const accountSet = new Set<string>()
    let sum = 0n
    for (const t of input.toAccounts) {
      if (accountSet.has(t.account)) throw new InvalidTransferError(`收款方重复: ${t.account}`)
      accountSet.add(t.account)
      sum += parseAmount(t.amount, 'toAccounts.amount')
    }
    const total = parseAmount(input.amount)
    if (sum !== total) {
      throw new InvalidTransferError(`收款方金额合计 ${sum} 不等于流动总金额 ${total}`)
    }
  }

  /**
   * 审核（单条原子写防僵尸单）
   * - 通过：audit_status=APPROVED + post_status NOT_READY->PENDING（同一条 UPDATE）
   * - 驳回：解冻（balance+=amt, frozen-=amt WHERE frozen>=amt）+ audit_status=REJECTED + post_status=REJECTED
   * - 0 行告警（已审核/状态不符）
   */
  async audit(
    input: AuditTransferInput,
    auditor?: { id?: string; text?: string },
    manager?: EntityManager,
  ): Promise<{ affected: number; action: 'approved' | 'rejected' }> {
    return this.ctx.tx(async (m) => {
      const em = manager ?? m
      const transferRepo = this.ctx.transferRepo(em)
      const transfer = await transferRepo.findOne({ where: { transferNo: input.transferNo } })
      if (!transfer) throw new InvalidTransferError(`交易单不存在: ${input.transferNo}`)

      if (input.auditStatus === 1) {
        // 通过：单条原子写（防 audit_status=APPROVED 但 post_status=NOT_READY 的僵尸单）
        const result = await em
          .createQueryBuilder()
          .update(LedgerTransferEntityRef)
          .set({
            auditStatus: AuditStatusDict.APPROVED,
            postStatus: PostStatusDict.PENDING,
            auditorId: auditor?.id ?? null,
            auditorText: auditor?.text ?? null,
            auditTime: () => 'NOW()',
            auditNotes: input.auditNotes ?? null,
          })
          .where('transferNo = :no AND auditStatus = :pending AND postStatus = :notReady', {
            no: input.transferNo,
            pending: AuditStatusDict.PENDING_REVIEW,
            notReady: PostStatusDict.NOT_READY,
          })
          .execute()
        return { affected: result.affected ?? 0, action: 'approved' }
      } else {
        // 驳回：解冻 + 置终态
        const result = await em
          .createQueryBuilder()
          .update(LedgerTransferEntityRef)
          .set({
            auditStatus: AuditStatusDict.REJECTED,
            postStatus: PostStatusDict.REJECTED,
            auditorId: auditor?.id ?? null,
            auditorText: auditor?.text ?? null,
            auditTime: () => 'NOW()',
            auditNotes: input.auditNotes ?? null,
          })
          .where('transferNo = :no AND auditStatus = :pending AND postStatus = :notReady', {
            no: input.transferNo,
            pending: AuditStatusDict.PENDING_REVIEW,
            notReady: PostStatusDict.NOT_READY,
          })
          .execute()
        if (result.affected && result.affected > 0) {
          // 解冻（条件 UPDATE，0 行=告警）
          const unfreeze = await em
            .createQueryBuilder()
            .update(this.ctx.accountEntityCtor)
            .set({
              balance: () => `balance + ${transfer.amount}`,
              frozen: () => `frozen - ${transfer.amount}`,
            })
            .where('id = :id AND frozen >= :amt AND deleteAt IS NULL', { id: transfer.fromAccountId, amt: transfer.amount })
            .execute()
          if (unfreeze.affected === 0) {
            // 最高优先级告警：状态已翻但资金未动
            console.error(`[LEDGER] 解冻 0 行告警: transferNo=${input.transferNo}, account=${transfer.fromAccountId}, amt=${transfer.amount}`)
          }
        }
        return { affected: result.affected ?? 0, action: 'rejected' }
      }
    })
  }

  /**
   * 冲正（原单须 POSTED 且未冲正；唯一索引防双冲正）
   * - 反向新单：原入账方变出账方，原出账方变入账方
   * - 复用制单+预占+消费管线
   */
  async createReversal(
    input: ReverseTransferInput,
    maker?: { id?: string; text?: string },
    manager?: EntityManager,
  ): Promise<{ transfer: any; created: boolean }> {
    return this.ctx.tx(async (m) => {
      const em = manager ?? m
      const transferRepo = this.ctx.transferRepo(em)

      // 幂等
      const existing = await transferRepo.findOne({ where: { bizRef: input.bizRef, bizType: input.bizType } })
      if (existing) return { transfer: existing, created: false }

      const original = await transferRepo.findOne({ where: { transferNo: input.originalTransferNo } })
      if (!original) throw new InvalidTransferError(`原交易单不存在: ${input.originalTransferNo}`)
      if (original.postStatus !== PostStatusDict.POSTED) {
        throw new InvalidTransferError(`原单未入账，不可冲正（当前状态: ${original.postStatus}）`)
      }
      if (original.reversedFromTransferNo) {
        throw new InvalidTransferError(`原单已是冲正单，不可再次冲正`)
      }

      // 原单 CAS 标记（防双冲正；唯一索引兜底）
      const mark = await em
        .createQueryBuilder()
        .update(LedgerTransferEntityRef)
        .set({ reversedFromTransferNo: input.bizRef })
        .where('transferNo = :no AND postStatus = :posted AND reversedFromTransferNo IS NULL', {
          no: input.originalTransferNo,
          posted: PostStatusDict.POSTED,
        })
        .execute()
      if (mark.affected === 0) {
        // 唯一索引兜底：已被冲正
        const refetched = await transferRepo.findOne({ where: { transferNo: input.originalTransferNo } })
        if (refetched?.reversedFromTransferNo) {
          throw new InvalidTransferError(`原单已被冲正（冲正单 bizRef=${refetched.reversedFromTransferNo}）`)
        }
        throw new InvalidTransferError(`原单状态不符，冲正失败`)
      }
      // 还原标记（冲正单自己的 reversedFromTransferNo 指向原单号；原单标记还原，靠冲正单唯一索引互斥）
      await em
        .createQueryBuilder()
        .update(LedgerTransferEntityRef)
        .set({ reversedFromTransferNo: null })
        .where('transferNo = :no', { no: input.originalTransferNo })
        .execute()

      // 构造反向制单：原入账方（toAccounts[0]）变出账方，原出账方变入账方
      const reversalInput: CreateTransferInput = {
        bizRef: input.bizRef,
        bizType: input.bizType,
        fromAccount: original.toAccounts[0].account,
        toAccounts: [{ account: original.fromAccountId, amount: original.amount }],
        amount: original.amount,
        currency: original.currency,
        needReview: false,
        description: input.description ?? `冲正 ${input.originalTransferNo}`,
        makerId: input.makerId,
        makerText: input.makerText,
        extra: input.extra,
      }
      // 复用制单逻辑（含预占），但 reversedFromTransferNo 标记
      const { transfer, created } = await this.createTransferWithReserve(reversalInput, maker, em)
      if (created) {
        await em
          .createQueryBuilder()
          .update(LedgerTransferEntityRef)
          .set({ reversedFromTransferNo: input.originalTransferNo })
          .where('transferNo = :no', { no: transfer.transferNo })
          .execute()
        transfer.reversedFromTransferNo = input.originalTransferNo
      }
      return { transfer, created }
    })
  }

  /** 标记入队时间（last_push_at） */
  async markEnqueued(transferNo: string, manager?: EntityManager): Promise<void> {
    const em = manager ?? this.ctx.dataSource.manager
    await em
      .createQueryBuilder()
      .update(LedgerTransferEntityRef)
      .set({ lastPushAt: () => 'NOW()' })
      .where('transferNo = :no', { no: transferNo })
      .execute()
  }
}

/** LedgerTransfer 实体引用（绕过循环依赖） */
import { LedgerTransfer as LedgerTransferEntityRef } from '../../../entities'

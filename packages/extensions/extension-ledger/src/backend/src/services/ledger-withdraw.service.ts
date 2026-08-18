/**
 * @fileoverview 审核流模板服务（提现等两段式审核业务）
 * @description 预占（冻结待审）/审核通过/驳回解冻/按外部单号定位/分页查询/汇总 全流程模板；
 * 业务语义（状态映射、字段映射、成功口径）内置，bizType/字段名/文案可配置复用（打款/退款等）
 */

import { Injectable, Inject } from '@nestjs/common'
import { LEDGER_OPTIONS, type LedgerModuleOptions, type TransferQueryFilter } from '../spi/interfaces'
import { AuditStatusDict, PostStatusDict, type AmountString, type HolderRef, type WithdrawView, type AuditFlowStatus, type TransferView } from 'moyan-mfw-extension-ledger/shared'
import { LedgerTransferService } from './ledger-transfer.service'
import { LedgerAccountService } from './ledger-account.service'

/** 预占入参 */
export interface WithdrawReserveInput {
  /** 业务幂等键（提现单 ID；同键重复预占返回已有单） */
  bizRef: string
  /** 提现方账户定位（用户/商家户） */
  from: HolderRef
  /** 收款方账户定位（资金池系统户） */
  to: HolderRef
  /** 提现金额（最小单位字符串） */
  amount: AmountString
  /** 外部单号（微信 out_batch_no 等；写入 externalNoField 对应预留索引位） */
  wxTransferNo?: string
  /** 提现类型（写入 typeField 对应预留索引位） */
  withdrawType?: string
  description?: string
  extra?: Record<string, unknown>
}

/** 分页查询入参（读侧状态 1=处理中 2=成功 3=失败） */
export interface WithdrawQueryInput {
  fromHolderType: string
  fromHolderId?: string
  fromHolderIds?: string[]
  withdrawType?: string | null
  status?: number
  /** 申请时间范围（含边界；纯日期按当天全天） */
  startDate?: Date | string
  endDate?: Date | string
  page?: number
  pageSize?: number
}

/** 汇总入参（口径：totalCount 全部 / withdrawn 成功 / pendingCount 处理中） */
export type WithdrawSumInput = Omit<WithdrawQueryInput, 'page' | 'pageSize'>

@Injectable()
export class LedgerWithdrawService {
  private readonly bizType: string
  private readonly externalNoField: string
  private readonly typeField: string
  private readonly statusTexts: Record<number, string>

  constructor(
    private readonly transferService: LedgerTransferService,
    private readonly accountService: LedgerAccountService,
    @Inject(LEDGER_OPTIONS) options: LedgerModuleOptions,
  ) {
    const cfg = options?.withdraw ?? {}
    this.bizType = cfg.bizType ?? 'withdraw'
    this.externalNoField = cfg.externalNoField ?? 'wxTransferNo'
    this.typeField = cfg.typeField ?? 'withdrawType'
    this.statusTexts = cfg.statusTexts ?? { 1: '处理中', 2: '成功', 3: '失败' }
  }

  /** 提现预占（needReview=true 冻结待审；幂等：bizRef 命中返回已有单） */
  async reserve(input: WithdrawReserveInput): Promise<{ transferNo: string; created: boolean }> {
    const extFields: Record<string, string> = {}
    if (input.wxTransferNo) extFields[this.externalNoField] = input.wxTransferNo
    if (input.withdrawType) extFields[this.typeField] = input.withdrawType
    const { transfer, created } = await this.transferService.createBizTransfer({
      bizRef: input.bizRef,
      bizType: this.bizType,
      from: input.from,
      to: input.to,
      amount: input.amount,
      needReview: true,
      description: input.description,
      extra: input.extra,
      extFields,
    })
    return { transferNo: transfer.transferNo, created }
  }

  /** 审核通过（NOT_READY->PENDING 入队；幂等：非 NOT_READY 返回 null） */
  async approve(bizRef: string, auditor?: { id?: string; text?: string }): Promise<{ affected: number; action: 'approved' | 'rejected' } | null> {
    const transfer = await this.transferService.findByBizRef(bizRef, this.bizType)
    if (!transfer || transfer.postStatus !== PostStatusDict.NOT_READY) return null
    const result = await this.transferService.audit(
      { transferNo: transfer.transferNo, auditStatus: 1, auditorId: auditor?.id, auditorText: auditor?.text },
      auditor,
    )
    return result
  }

  /** 审核驳回（解冻 + REJECTED 终态；幂等：非 NOT_READY 返回 null） */
  async reject(bizRef: string, reason?: string, auditor?: { id?: string; text?: string }): Promise<{ affected: number; action: 'approved' | 'rejected' } | null> {
    const transfer = await this.transferService.findByBizRef(bizRef, this.bizType)
    if (!transfer || transfer.postStatus !== PostStatusDict.NOT_READY) return null
    const result = await this.transferService.audit(
      { transferNo: transfer.transferNo, auditStatus: 2, auditNotes: reason, auditorId: auditor?.id, auditorText: auditor?.text },
      auditor,
    )
    return result
  }

  /** 按外部单号定位（微信回调入口；不存在返回 null 不抛错） */
  async findByExternalNo(externalNo: string): Promise<WithdrawView | null> {
    const transfer = await this.transferService.findByExtField(this.bizType, this.externalNoField, externalNo)
    if (!transfer) return null
    return this.toWithdrawView(transfer)
  }

  /** 分页查询提现记录（字段映射：id=bizRef、externalNo=外部单号、transferredAt=auditTime、failReason=auditNotes） */
  async queryWithdrawals(filter: WithdrawQueryInput): Promise<{ list: WithdrawView[]; total: number; page: number; pageSize: number }> {
    const page = Math.max(1, filter.page || 1)
    const pageSize = Math.max(1, Math.min(filter.pageSize || 10, 100))
    const query = this.buildQueryFilter(filter)
    query.page = page
    query.pageSize = pageSize
    const { items, total } = await this.transferService.queryTransfers(query)

    // 批量解析主体 ID（fromAccountId -> holderId，去重后单查）
    const holderIdMap = new Map<string, string>()
    for (const t of items) {
      if (!holderIdMap.has(t.fromAccountId)) {
        const account = await this.accountService.getAccount(t.fromAccountId)
        holderIdMap.set(t.fromAccountId, account?.holderId ?? t.fromAccountId)
      }
    }
    const list = items.map((t) => ({ ...this.toWithdrawView(t), holderId: holderIdMap.get(t.fromAccountId) ?? t.fromAccountId }))
    return { list, total, page, pageSize }
  }

  /**
   * 提现汇总（金额为最小单位字符串）
   * 口径：totalCount=筛选全部；withdrawn=审核通过且未失败（auditStatus=APPROVED AND postStatus NOT IN (FAILED,CANCELLED,REJECTED)）；
   * pendingCount=处理中（postStatus IN (NOT_READY,PENDING,POSTING)）
   */
  async sumWithdrawn(filter: WithdrawSumInput): Promise<{ totalCount: number; withdrawn: AmountString; pendingCount: number }> {
    const base = this.buildQueryFilter(filter)
    const [total, withdrawn, pending] = await Promise.all([
      this.transferService.sumTransfers(base),
      this.transferService.sumTransfers({
        ...base,
        auditStatus: AuditStatusDict.APPROVED,
        postStatusExclude: [PostStatusDict.FAILED, PostStatusDict.CANCELLED, PostStatusDict.REJECTED],
      }),
      this.transferService.sumTransfers({
        ...base,
        postStatus: [PostStatusDict.NOT_READY, PostStatusDict.PENDING, PostStatusDict.POSTING],
      }),
    ])
    return {
      totalCount: total.totalCount,
      withdrawn: withdrawn.totalAmount,
      pendingCount: pending.totalCount,
    }
  }

  /** 读侧筛选 → 账本状态组合（1 处理中 / 2 成功 / 3 失败） */
  private applyStatusFilter(status: number | undefined, query: TransferQueryFilter): void {
    if (status === 1) {
      query.postStatus = [PostStatusDict.NOT_READY, PostStatusDict.PENDING, PostStatusDict.POSTING]
    } else if (status === 2) {
      query.postStatus = PostStatusDict.POSTED
      query.auditStatus = AuditStatusDict.APPROVED
    } else if (status === 3) {
      query.postStatus = [PostStatusDict.FAILED, PostStatusDict.CANCELLED, PostStatusDict.REJECTED]
    }
  }

  /** 公共查询条件构建（分页/汇总共用） */
  private buildQueryFilter(filter: WithdrawQueryInput): TransferQueryFilter {
    const query: TransferQueryFilter = {
      bizType: this.bizType,
      fromAccountType: filter.fromHolderType,
    }
    if (filter.fromHolderIds && filter.fromHolderIds.length > 0) {
      query.fromAccountHolderIds = filter.fromHolderIds
    } else if (filter.fromHolderId) {
      query.fromAccountHolderIds = [filter.fromHolderId]
    }
    if (filter.withdrawType) {
      query.extFields = { [this.typeField]: filter.withdrawType }
    }
    this.applyStatusFilter(filter.status, query)
    if (filter.startDate) query.startDate = new Date(filter.startDate)
    if (filter.endDate) query.endDate = this.toExclusiveEnd(filter.endDate)
    return query
  }

  /** 结束时间含边界：纯日期（无时间部分）按当天全天（转次日 00:00）；带时间原样（< 不含边界） */
  private toExclusiveEnd(endDate: Date | string): Date {
    const d = endDate instanceof Date ? endDate : new Date(endDate)
    const isPureDate = !endDate.toString().includes('T') && !endDate.toString().includes(' ')
    if (isPureDate) d.setDate(d.getDate() + 1)
    return d
  }

  /** 交易单 → 提现视图（状态映射：成功=POSTED+APPROVED；处理中=NOT_READY/PENDING/POSTING；其余失败） */
  private toWithdrawView(t: TransferView): WithdrawView {
    let status: AuditFlowStatus
    if (t.postStatus === PostStatusDict.POSTED && t.auditStatus === AuditStatusDict.APPROVED) {
      status = 2
    } else if ([PostStatusDict.NOT_READY, PostStatusDict.PENDING, PostStatusDict.POSTING].includes(t.postStatus)) {
      status = 1
    } else {
      status = 3
    }
    return {
      id: t.bizRef,
      holderId: t.fromAccountId,
      amount: t.amount,
      status,
      statusText: this.statusTexts[status] ?? '未知',
      externalNo: t.extFields?.[this.externalNoField] ?? null,
      withdrawType: t.extFields?.[this.typeField] ?? null,
      createdAt: t.createdAt,
      transferredAt: t.auditTime ?? null,
      failReason: t.auditNotes ?? null,
      rawPostStatus: t.postStatus,
      rawAuditStatus: t.auditStatus,
    }
  }
}

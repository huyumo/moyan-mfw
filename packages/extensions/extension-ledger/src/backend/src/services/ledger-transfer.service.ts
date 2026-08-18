/**
 * @fileoverview 交易单服务 - 业务层入口
 * @description 制单（同步预占+入队）、审核、冲正、重推、取消、查询聚合；注入 storage/queue/notifier SPI
 */

import { Injectable, Inject, Logger } from '@nestjs/common'
import {
  LEDGER_STORAGE,
  LEDGER_QUEUE,
  LEDGER_NOTIFIER,
  LEDGER_FIELD_EXTENSION,
  LEDGER_OPTIONS,
  type LedgerModuleOptions,
} from '../spi/interfaces'
import type { ILedgerStorage, ILedgerQueue, ILedgerNotifier, ILedgerFieldExtension, TransferQueryFilter } from '../spi/interfaces'
import type { CreateTransferInput, AuditTransferInput, ReverseTransferInput, TransferView, AccountView, AmountString, HolderRef, EntryView } from 'moyan-mfw-extension-ledger/shared'
import { InsufficientBalanceError, InvalidTransferError } from '../spi/impl/storage/transfer.storage'
import { LedgerAccountService } from './ledger-account.service'

/** 一行式制单入参（账户用 holder 三元组定位，内部懒开户） */
export interface CreateBizTransferInput {
  /** 业务幂等键（同 bizRef+bizType 重复制单返回已有单） */
  bizRef: string
  bizType: string
  /** 转出方账户定位 */
  from: HolderRef
  /** 收款方账户定位 */
  to: HolderRef
  /** 流动总金额（最小单位字符串） */
  amount: AmountString
  /** 业务扩展字段（语义键值，经 bizExtMappings 映射写预留索引位） */
  extFields?: Record<string, string>
  /** 是否需要审核（true: 冻结待审；默认 false 免审直入队） */
  needReview?: boolean
  /** 关联业务单号（审计展示用） */
  associatedOrder?: string
  description?: string
  /** 扩展附录（JSON，经字段扩展 SPI 校验） */
  extra?: Record<string, unknown>
}

@Injectable()
export class LedgerTransferService {
  private readonly logger = new Logger(LedgerTransferService.name)

  constructor(
    @Inject(LEDGER_STORAGE) private readonly storage: ILedgerStorage,
    @Inject(LEDGER_QUEUE) private readonly queue: ILedgerQueue,
    @Inject(LEDGER_NOTIFIER) private readonly notifier: ILedgerNotifier,
    @Inject(LEDGER_FIELD_EXTENSION) private readonly fieldExt: ILedgerFieldExtension,
    @Inject(LEDGER_OPTIONS) private readonly options: LedgerModuleOptions,
    private readonly accountService: LedgerAccountService,
  ) {}

  /**
   * 制单（同步预占 + 入队）
   * - 幂等：bizRef 命中返回已有单（不重复预占/入队）
   * - 免审单：预占 pending_out + 立即入队
   * - 需审单：预占 frozen + 不入队（等审核通过）
   */
  async createTransfer(input: CreateTransferInput, maker?: { id?: string; text?: string }): Promise<{ transfer: TransferView; created: boolean }> {
    // bizType 注册制校验
    if (this.options.bizTypes && this.options.bizTypes.length > 0) {
      if (!this.options.bizTypes.includes(input.bizType)) {
        throw new InvalidTransferError(`未注册的业务类型: ${input.bizType}`)
      }
    }
    // 扩展字段校验
    this.fieldExt.validateTransferExtra(input.bizType, input.extra ?? null)

    const { transfer, created } = await this.storage.createTransferWithReserve(input, maker)

    if (created && !input.needReview) {
      // 免审单：入队（失败由兜底扫描补发）
      try {
        await this.queue.enqueue(transfer.transferNo)
        await this.storage.markEnqueued(transfer.transferNo)
      } catch (err: any) {
        // 入队失败不阻断制单（兜底扫描补发）
        this.logger.warn(`制单成功但入队失败 ${transfer.transferNo}（兜底扫描将补发）: ${err?.message}`)
      }
    }
    return { transfer, created }
  }

  /**
   * 一行式制单（账户按 holder 三元组定位，不存在自动懒开户）
   * 业务层记账方法的标准入口：幂等键 + 业务类型 + 双方账户 + 金额 + 扩展字段
   */
  async createBizTransfer(input: CreateBizTransferInput, maker?: { id?: string; text?: string }): Promise<{ transfer: TransferView; created: boolean }> {
    const [fromAccount, toAccount] = await Promise.all([
      this.accountService.ensureAccount(input.from),
      this.accountService.ensureAccount(input.to),
    ])
    return this.createTransfer(
      {
        bizRef: input.bizRef,
        bizType: input.bizType,
        fromAccount: fromAccount.id,
        toAccounts: [{ account: toAccount.id, amount: input.amount }],
        amount: input.amount,
        currency: toAccount.currency,
        needReview: input.needReview ?? false,
        associatedOrder: input.associatedOrder,
        description: input.description,
        makerId: maker?.id,
        makerText: maker?.text,
        extra: input.extra,
        extFields: input.extFields,
      },
      maker,
    )
  }

  /** 审核（通过入队 / 驳回解冻） */
  async audit(input: AuditTransferInput, auditor?: { id?: string; text?: string }): Promise<{ affected: number; action: 'approved' | 'rejected' }> {
    const { affected, action } = await this.storage.audit(input, auditor)
    if (affected === 0) {
      throw new InvalidTransferError(`审核失败：交易单不存在或状态不符 ${input.transferNo}`)
    }
    if (action === 'approved' && input.auditStatus === 1) {
      // 审核通过：入队
      try {
        await this.queue.enqueue(input.transferNo)
        await this.storage.markEnqueued(input.transferNo)
      } catch (err: any) {
        this.logger.warn(`审核通过但入队失败 ${input.transferNo}（兜底扫描将补发）: ${err?.message}`)
      }
    }
    return { affected, action }
  }

  /** 冲正（原单须 POSTED；复用制单+预占+消费管线） */
  async reverse(input: ReverseTransferInput, maker?: { id?: string; text?: string }): Promise<{ transfer: TransferView; created: boolean }> {
    const { transfer, created } = await this.storage.createReversal(input, maker)
    if (created) {
      try {
        await this.queue.enqueue(transfer.transferNo)
        await this.storage.markEnqueued(transfer.transferNo)
      } catch (err: any) {
        this.logger.warn(`冲正单入队失败 ${transfer.transferNo}（兜底扫描将补发）: ${err?.message}`)
      }
    }
    return { transfer, created }
  }

  /** 人工重推（FAILED/CANCELLED->PENDING + 重置 retry + 入队） */
  async repost(transferNo: string): Promise<{ affected: number }> {
    const { affected } = await this.storage.repost(transferNo)
    if (affected === 0) throw new InvalidTransferError(`重推失败：交易单不存在或状态不符 ${transferNo}`)
    await this.queue.enqueue(transferNo)
    await this.storage.markEnqueued(transferNo)
    return { affected }
  }

  /** 批量重推（≤1000） */
  async batchRepost(transferNos: string[]): Promise<{ affected: number }> {
    const { affected } = await this.storage.batchRepost(transferNos)
    for (const no of transferNos) {
      await this.queue.enqueue(no)
    }
    return { affected }
  }

  /** 取消（FAILED->CANCELLED + 按 hold_type 回滚预占） */
  async cancel(transferNo: string, operator?: { id?: string; text?: string }): Promise<{ affected: number; reserveAffected: number }> {
    const result = await this.storage.cancel(transferNo, operator)
    if (result.affected === 0) {
      throw new InvalidTransferError(`取消失败：交易单不存在或非 FAILED 状态 ${transferNo}`)
    }
    if (result.reserveAffected === 0) {
      this.logger.error(`取消回滚预占 0 行告警: ${transferNo}（资金未动，需人工核查）`)
    }
    return result
  }

  /** 查交易单 */
  async getTransfer(transferNo: string): Promise<TransferView | null> {
    return this.storage.getTransfer(transferNo)
  }

  /** 按幂等键查 */
  async findByBizRef(bizRef: string, bizType: string): Promise<TransferView | null> {
    return this.storage.findTransferByBizRef(bizRef, bizType)
  }

  /** 按业务扩展字段定位（如按外部单号查提现单；须 bizType + 映射已配置） */
  async findByExtField(bizType: string, field: string, value: string): Promise<TransferView | null> {
    const { items } = await this.storage.queryTransfers({ bizType, extFields: { [field]: value }, page: 1, pageSize: 1 })
    return items[0] ?? null
  }

  /** 交易单分页 */
  async queryTransfers(filter: TransferQueryFilter): Promise<{ items: TransferView[]; total: number }> {
    return this.storage.queryTransfers(filter)
  }

  /** 交易单聚合（COUNT + SUM(amount)；过滤条件与 queryTransfers 一致） */
  async sumTransfers(filter: TransferQueryFilter): Promise<{ totalCount: number; totalAmount: AmountString }> {
    return this.storage.sumTransfers(filter)
  }

  /** 流水分页 */
  async queryEntries(filter: any): Promise<{ items: EntryView[]; total: number }> {
    return this.storage.queryEntries(filter)
  }
}

/** 余额不足错误（对外导出，供业务方捕获） */
export { InsufficientBalanceError }

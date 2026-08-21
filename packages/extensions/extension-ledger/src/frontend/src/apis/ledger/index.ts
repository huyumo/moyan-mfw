/**
 * @fileoverview 借贷记账 API 调用类
 * @description 声明式 ApiCall 类（对齐 extension-scheduler 模式），后端运行后可通过 pnpm build:api 从 Swagger 自动重新生成
 */
import { ApiCall } from 'moyan-api'
import type { MoMethod } from 'moyan-api'

/** 账户项 */
export interface LedgerAccountItem {
  id: string
  holderId: string
  holderType: string
  tag: string
  currency: string
  balance: string
  frozen: string
  pendingOut: string
  totalIncome: string
  totalOutcome: string
  extra: Record<string, any> | null
}

/** 收款方明细 */
export interface TransferTargetItem {
  account: string
  amount: string
}

/** 交易单项 */
export interface LedgerTransferItem {
  transferNo: string
  bizRef: string
  bizType: string
  fromAccountId: string
  toAccounts: TransferTargetItem[]
  amount: string
  currency: string
  transferMode: number
  needReview: boolean
  holdType: number
  auditStatus: number
  postStatus: number
  retryCount: number
  claimToken: string | null
  claimAt: string | null
  nextRetryAt: string | null
  lastPushAt: string | null
  lastError: string | null
  reversedFromTransferNo: string | null
  description: string | null
  makerId: string | null
  makerText: string | null
  auditorId: string | null
  auditorText: string | null
  auditTime: string | null
  auditNotes: string | null
  /** 审核按账户备注（accountId -> { note, noteExtra }） */
  accountNotes?: Record<string, { note?: string; noteExtra?: Record<string, any> }> | null
  createdAt: string
  /**
   * 业务扩展字段（预留索引位 ext_col1~4 翻译回的语义对象）
   * 如 { promoterId: 'P888', campaignId: 'C99' }；无映射时为空对象
   */
  extFields?: Record<string, string>
  /** 扩展附录（原始 JSON 快照） */
  extra?: Record<string, any> | null
}

/** 分录项 */
export interface LedgerEntryItem {
  id: string
  accountId: string
  entryNo: string
  transferNo: string
  direction: number
  signedAmount: string
  balanceBefore: string | null
  balanceAfter: string | null
  /** 币种（入账时从交易单带入；NULL 历史数据按 CNY 展示） */
  currency?: string | null
  createdAt: string
  /** 交易类型（后端富化，来自交易单） */
  bizType?: string | null
  /** 制单备注（后端富化） */
  description?: string | null
  /** 是否冲正腿（1=冲正产生的反向分录，挂原单 transferNo） */
  isReversal?: number
  /** 本分录账户的审核备注（按账户派生） */
  note?: string | null
  /** 本分录账户的审核备注特殊信息（JSON） */
  noteExtra?: Record<string, any> | null
}

/** 冲正记录项 */
export interface LedgerReversalItem {
  reversalNo: string
  originalTransferNo: string
  bizRef: string
  bizType: string
  currency: string
  amount: string
  /** 原转出方账户 ID（资金退回目的地） */
  fromAccountId: string
  /** 原收款方明细（冲正后各自退回其金额） */
  toAccounts: TransferTargetItem[]
  /** 冲正状态（1=已冲正） */
  status: number
  description: string | null
  makerId: string | null
  makerText: string | null
  extra: Record<string, any> | null
  createdAt: string
}

/** 分页结果 */
export interface PageResult<T> {
  items: T[]
  total: number
}

/** 开户请求 */
export interface OpenAccountParams {
  holderId: string
  holderType?: string
  tag?: string
  currency?: string
  initialBalance?: string
  sysAccountKey?: string
  extra?: Record<string, unknown>
}

/** 制单请求 */
export interface CreateTransferParams {
  bizRef: string
  bizType: string
  fromAccount: string
  toAccounts: TransferTargetItem[]
  amount: string
  currency: string
  needReview: boolean
  associatedOrder?: string
  description?: string
  extra?: Record<string, unknown>
  /** 业务扩展筛选字段（语义键值，映射到预留索引位 ext_col1~4） */
  extFields?: Record<string, string>
}

/** 审核请求 */
export interface AuditTransferParams {
  transferNo: string
  auditStatus: 1 | 2
  auditNotes?: string
  /** 按交易相关账户分别编写的审核备注（accountId -> { note, noteExtra }） */
  accountNotes?: Record<string, { note?: string; noteExtra?: Record<string, unknown> }>
}

/** 冲正请求 */
export interface ReverseTransferParams {
  originalTransferNo: string
  bizRef: string
  bizType: string
  description?: string
  extra?: Record<string, unknown>
}

/** 通用分页查询参数 */
export interface PageQueryParams {
  page?: number
  pageSize?: number
}

// ── 账户 ──

/** 开户 */
export class ApiLedgerOpenAccount extends ApiCall<{ body: OpenAccountParams }, any> {
  readonly path = '/api/ext/ledger/accounts'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/** 账户分页列表 */
export class ApiLedgerListAccounts extends ApiCall<
  { query: PageQueryParams & { id?: string; holderId?: string; tag?: string; currency?: string } },
  PageResult<LedgerAccountItem>
> {
  readonly path = '/api/ext/ledger/accounts'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/** 账户详情 */
export class ApiLedgerGetAccount extends ApiCall<{ params: { id: string } }, LedgerAccountItem> {
  readonly path = '/api/ext/ledger/accounts/{id}'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

// ── 交易单 ──

/** 制单 */
export class ApiLedgerCreateTransfer extends ApiCall<{ body: CreateTransferParams }, any> {
  readonly path = '/api/ext/ledger/transfers'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/** 审核 */
export class ApiLedgerAuditTransfer extends ApiCall<{ body: AuditTransferParams }, any> {
  readonly path = '/api/ext/ledger/transfers/audit'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/** 冲正 */
export class ApiLedgerReverseTransfer extends ApiCall<{ body: ReverseTransferParams }, any> {
  readonly path = '/api/ext/ledger/transfers/reverse'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/** 人工重推 */
export class ApiLedgerRepostTransfer extends ApiCall<{ params: { transferNo: string } }, any> {
  readonly path = '/api/ext/ledger/transfers/repost/{transferNo}'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}

/** 批量重推 */
export class ApiLedgerBatchRepost extends ApiCall<{ body: { transferNos: string[] } }, any> {
  readonly path = '/api/ext/ledger/transfers/batch-repost'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}

/** 取消 */
export class ApiLedgerCancelTransfer extends ApiCall<{ params: { transferNo: string } }, any> {
  readonly path = '/api/ext/ledger/transfers/cancel/{transferNo}'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}

/** 交易单分页 */
export class ApiLedgerListTransfers extends ApiCall<
  {
    query: PageQueryParams & {
      /** 交易单号精确筛选 */
      transferNo?: string
      /** 业务幂等键精确筛选 */
      bizRef?: string
      postStatus?: string
      auditStatus?: number
      bizType?: string
      fromAccountId?: string
      /** 收款方账户ID（to 侧） */
      toAccountId?: string
      /** 收款方主体ID集合（to 侧，逗号分隔） */
      toHolderIds?: string
      /** 业务扩展字段等值筛选（JSON 字符串，如 {"promoterId":"P888"}，须配 bizType） */
      extFields?: string
    }
  },
  PageResult<LedgerTransferItem>
> {
  readonly path = '/api/ext/ledger/transfers'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/** 交易单详情 */
export class ApiLedgerGetTransfer extends ApiCall<{ params: { transferNo: string } }, LedgerTransferItem> {
  readonly path = '/api/ext/ledger/transfers/{transferNo}'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

// ── 分录 ──

/** 流水分页 */
export class ApiLedgerListEntries extends ApiCall<
  {
    query: PageQueryParams & {
      accountId?: string
      transferNo?: string
      direction?: number
      /** 交易类型（按交易单 bizType 过滤；须带 accountId） */
      bizType?: string
      startDate?: string
      endDate?: string
    }
  },
  PageResult<LedgerEntryItem>
> {
  readonly path = '/api/ext/ledger/entries'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/** 流水导出 */
export class ApiLedgerExportEntries extends ApiCall<
  { query: { accountId: string; startDate: string; endDate: string } },
  PageResult<LedgerEntryItem>
> {
  readonly path = '/api/ext/ledger/entries/export'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

// ── 对账 ──

/** 全量对账 */
export class ApiLedgerRunReconcile extends ApiCall<{}, any> {
  readonly path = '/api/ext/ledger/reconcile'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/** 对账报告分页 */
export class ApiLedgerListReconcileReports extends ApiCall<
  { query: PageQueryParams & { status?: number } },
  PageResult<any>
> {
  readonly path = '/api/ext/ledger/reconcile/reports'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/** 单账户对账 */
export class ApiLedgerRunAccountReconcile extends ApiCall<{ params: { accountId: string } }, any> {
  readonly path = '/api/ext/ledger/reconcile/account/{accountId}'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/** 增量修复 */
export class ApiLedgerApplyFix extends ApiCall<{ params: { accountId: string } }, any> {
  readonly path = '/api/ext/ledger/reconcile/fix/{accountId}'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}

/** 业务类型展示元数据（服务端 forRoot({ bizTypeMetas }) 下发；驱动动态列/搜索/详情显示名） */
export class ApiLedgerGetBizTypeMetas extends ApiCall<{}, Record<string, any>> {
  readonly path = '/api/ext/ledger/biz-types'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

// ── 冲正记录 ──

/** 冲正记录分页（审计入口） */
export class ApiLedgerListReversals extends ApiCall<
  {
    query: PageQueryParams & {
      reversalNo?: string
      originalTransferNo?: string
      bizType?: string
    }
  },
  PageResult<LedgerReversalItem>
> {
  readonly path = '/api/ext/ledger/reversals'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/** 冲正记录详情 */
export class ApiLedgerGetReversal extends ApiCall<{ params: { reversalNo: string } }, LedgerReversalItem> {
  readonly path = '/api/ext/ledger/reversals/{reversalNo}'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

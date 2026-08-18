/**
 * @fileoverview 借贷记账扩展包共享类型定义
 * @description 前后端共用的数据结构与入参类型
 */

/** 金额类型：始终以字符串传输（bigint 最小单位），避免 JS Number 精度丢失（>2^53） */
export type AmountString = string

/** 收款方明细（1对多转账的 to_accounts 数组项） */
export interface TransferTargetItem {
  /** 收款方账户 ID */
  account: string
  /** 转入金额（最小单位字符串） */
  amount: AmountString
}

/** 账户简表（列表/选项用） */
export interface LedgerAccountBrief {
  id: string
  holderId: string
  holderType: string
  tag: string
  currency: string
  balance: AmountString
  frozen: AmountString
  pendingOut: AmountString
}

/** 制单入参（供业务层直接调用服务或经 controller 传入） */
export interface CreateTransferInput {
  /** 业务幂等键（同 bizRef+bizType 重复制单返回已有单） */
  bizRef: string
  /** 业务类型（与 bizRef 组合构成幂等键） */
  bizType: string
  /** 转出方账户 ID */
  fromAccount: string
  /** 收款方明细（1对1 时单元素数组） */
  toAccounts: TransferTargetItem[]
  /** 流动总金额（最小单位字符串，须等于 Σ toAccounts.amount） */
  amount: AmountString
  /** 币种（须与 from/to 账户币种一致） */
  currency: string
  /** 是否需要审核（true: 制单后冻结待审；false: 直接预占入队） */
  needReview: boolean
  /** 关联业务单号（可选，用于审计展示） */
  associatedOrder?: string
  /** 备注 */
  description?: string
  /** 制单人 ID */
  makerId?: string
  /** 制单人名称 */
  makerText?: string
  /** 扩展附录（JSON，经字段扩展 SPI 校验） */
  extra?: Record<string, unknown>
  /**
   * 扩展筛选字段（语义键值，如 { promoterId: 'P888' }）
   * 经 forRoot({ bizExtMappings }) 映射写入预留索引位（ext_col1~4），支持按索引等值筛选；
   * 未在映射表声明的字段制单时报错
   */
  extFields?: Record<string, string>
}

/** 审核入参 */
export interface AuditTransferInput {
  transferNo: string
  /** 1=通过 2=驳回 */
  auditStatus: 1 | 2
  auditNotes?: string
  auditorId?: string
  auditorText?: string
}

/** 冲正入参 */
export interface ReverseTransferInput {
  /** 被冲正的原交易单号（须 POSTED 且未被冲正过） */
  originalTransferNo: string
  /** 冲正单的业务幂等键 */
  bizRef: string
  bizType: string
  description?: string
  makerId?: string
  makerText?: string
  extra?: Record<string, unknown>
}

/** 账户定位（holder 三元组，供 createBizTransfer / 审核流模板等高层 API 使用） */
export interface HolderRef {
  holderId: string
  /** 主体类型（默认 'system'） */
  holderType?: string
  /** 账户标签（默认 'default'） */
  tag?: string
  /** 币种（默认 'CNY'） */
  currency?: string
}

/**
 * 交易单视图（业务层读侧统一结构）
 * extCol1~4 物理列已翻译为 extFields 语义对象；其余字段与实体一致
 */
export interface TransferView {
  transferNo: string
  bizRef: string
  bizType: string
  fromAccountId: string
  toAccounts: TransferTargetItem[]
  amount: AmountString
  currency: string
  needReview: boolean
  auditStatus: number
  postStatus: number
  auditTime: Date | null
  auditNotes: string | null
  description: string | null
  makerId: string | null
  makerText: string | null
  auditorId: string | null
  auditorText: string | null
  retryCount: number
  createdAt: Date
  /** 冲正单：被冲正的原单号；原单被冲正后：冲正单 bizRef */
  reversedFromTransferNo?: string | null
  /** 业务扩展字段（语义键值，由预留索引位翻译；无映射时为空对象） */
  extFields?: Record<string, string>
}

/** 账户视图（业务层读侧统一结构） */
export interface AccountView {
  id: string
  sysAccountKey: string | null
  holderId: string
  holderType: string
  tag: string
  currency: string
  /** 可用余额（最小单位字符串） */
  balance: AmountString
  /** 审核冻结（最小单位字符串） */
  frozen: AmountString
  /** 预占在途（最小单位字符串） */
  pendingOut: AmountString
  totalIncome: AmountString
  totalOutcome: AmountString
  extra: Record<string, unknown> | null
  createdAt: Date
}

/** 分录视图（流水分页返回项） */
export interface EntryView {
  id: number
  accountId: string
  entryNo: string
  transferNo: string
  /** 1=借 2=贷 */
  direction: number
  signedAmount: AmountString
  balanceBefore: AmountString
  balanceAfter: AmountString
  extra: Record<string, unknown> | null
  createdAt: Date
  /** 币种（历史数据可能为 NULL，前端按 CNY 展示） */
  currency?: string | null
}

/** 审核流读侧状态：1=处理中 2=成功 3=失败 */
export type AuditFlowStatus = 1 | 2 | 3

/**
 * 审核流交易视图（提现记录等两段式审核业务读侧统一结构）
 * 字段映射：id=bizRef、externalNo=外部单号语义字段、typeField=类型语义字段、
 * transferredAt=auditTime、failReason=auditNotes；金额为最小单位字符串
 */
export interface WithdrawView {
  /** 业务幂等键（提现单 ID） */
  id: string
  holderId: string
  amount: AmountString
  status: AuditFlowStatus
  statusText: string
  /** 外部单号（微信 out_batch_no 等，映射到 extCol1） */
  externalNo: string | null
  /** 类型字段值（提现场景，映射到 extCol2） */
  withdrawType: string | null
  createdAt: Date
  transferredAt: Date | null
  failReason: string | null
  /** 原始账本状态（透传，供业务层自行扩展判断） */
  rawPostStatus: number
  rawAuditStatus: number
}

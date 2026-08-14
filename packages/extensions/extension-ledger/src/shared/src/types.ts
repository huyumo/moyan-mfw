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

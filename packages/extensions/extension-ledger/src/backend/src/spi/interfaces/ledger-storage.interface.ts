/**
 * @fileoverview 存储适配器 SPI 接口
 * @description 全部原子 SQL 下沉于此；并发正确性靠单条条件 UPDATE（CAS）保证
 *
 * 契约（四路评审修正）：
 *   - 认领必须条件更新（PENDING->POSTING + claim_token + claim_at），影响 0 行=已被处理
 *   - 入账事务末位必须是 claim_token CAS（POSTING->POSTED），0 行=已被接管->整体回滚
 *   - 失败回退必须带 claim_token 条件，0 行=已被接管->直接放弃（不重试）
 *   - 取消/回滚按 hold_type 分桶（PENDING_OUT / FROZEN）
 *   - 金额一律 bigint 字符串，参数化查询（禁止字符串拼接）
 */

import type { EntityManager } from 'typeorm'
import type {
  CreateTransferInput,
  AuditTransferInput,
  ReverseTransferInput,
  AmountString,
  AccountView,
  TransferView,
  ReversalView,
  EntryView,
} from 'moyan-mfw-extension-ledger/shared'

/** 对账差异项（结构定义，避免与实体层循环引用） */
export interface ReconcileDiffItem {
  accountId: string
  balance: string
  frozen: string
  pendingOut: string
  entrySum: string
  diff: string
}

/** 认领结果 */
export interface ClaimResult {
  /** 影响行数：1=认领成功可继续；0=已被处理/他人认领/不存在（须 XACK 跳过） */
  affected: number
  /** 认领到的交易单（affected=1 时有值） */
  transfer?: TransferView
}

/** 入账事务执行结果 */
export interface PostResult {
  /** true=入账成功（已 POSTED）；false=fencing 失败（已被接管，须放弃） */
  success: boolean
  /** 错误信息（success=false 且非 fencing 时） */
  error?: string
}

/** 兜底扫描发现项 */
export interface ScavengeItem {
  transferNo: string
  /** 'pending_timeout'=入队超时补发；'orphan'=POSTING 孤儿重置 */
  reason: 'pending_timeout' | 'orphan'
}

/**
 * 存储适配器接口
 * @description 默认实现 TypeOrmLedgerStorage；分库分表可替换实现
 */
export interface ILedgerStorage {
  // ── 账户 ──
  /** 开户（幂等：holderId+holderType+tag+currency 命中返回已有；并发冲突自动重查）；初始余额同步入账 */
  openAccount(input: OpenAccountInput, manager?: EntityManager): Promise<AccountView>
  /** 查账户 */
  getAccount(accountId: string, manager?: EntityManager): Promise<AccountView | null>
  /** 按 holder + tag + currency 查账户 */
  findAccount(holderId: string, holderType: string, tag: string, currency: string, manager?: EntityManager): Promise<AccountView | null>
  /**
   * 幂等补齐期初流水（自愈历史半截账户：有账面余额但缺 open_account 期初流水）
   * 幂等键命中即跳过；并发安全（事务 + 账户行锁 + 唯一键兜底）
   */
  ensureOpeningEntry(accountId: string, manager?: EntityManager): Promise<void>

  // ── 制单（同步事务：插单 + 预占） ──
  /**
   * 制单（幂等 + 预占）
   * @returns { transfer, created } created=false 表示 bizRef 命中返回已有单
   */
  createTransferWithReserve(input: CreateTransferInput, maker?: { id?: string; text?: string }, manager?: EntityManager): Promise<{ transfer: TransferView; created: boolean }>

  // ── 审核 ──
  /**
   * 审核通过（NOT_READY->PENDING 单条原子写）；驳回（解冻+REJECTED）。返回影响行数
   * 契约：入参 AuditTransferInput.accountNotes（accountId -> { note, noteExtra }）须持久化到交易单
   * （默认实现写入 accountNotes 列），供流水查询按账户派生展示；不影响 auditNotes 语义
   */
  audit(input: AuditTransferInput, auditor?: { id?: string; text?: string }, manager?: EntityManager): Promise<{ affected: number; action: 'approved' | 'rejected' }>

  // ── 冲正（独立冲正记录，同步事务，不入 ext_ledger_transfer） ──
  /**
   * 冲正（原单须 POSTED 且未冲正；同步事务完成，**不入 ext_ledger_transfer**）
   * 契约：
   *   - 全额冲正：原单各收款方将其收款金额各自退回原转出方（fromAccountId）
   *   - 持久化到 ext_ledger_reversal（reversalNo 主键；originalTransferNo 唯一=防双冲正；bizRef+bizType 唯一=幂等）
   *   - 冲正腿分录写入分录表（isReversal=1，transferNo 挂原单号），保证对账恒等式与账户流水连续
   *   - **不更新账户 totalIncome/totalOutcome**（资金回流非新增收支，不影响累计转入/转出）
   *   - 原单 reversedFromTransferNo 永久记录冲正单号；失败整体回滚（含余额不足校验）
   *   - 幂等：bizRef+bizType 命中返回已有记录（created=false）
   * @returns { reversal, created }
   */
  createReversal(input: ReverseTransferInput, maker?: { id?: string; text?: string }, manager?: EntityManager): Promise<{ reversal: ReversalView; created: boolean }>
  /** 查冲正记录 */
  getReversal(reversalNo: string, manager?: EntityManager): Promise<ReversalView | null>
  /** 冲正记录分页（审计入口；冲正不入交易单表，故与 queryTransfers 独立） */
  queryReversals(filter: ReversalQueryFilter, manager?: EntityManager): Promise<{ items: ReversalView[]; total: number }>

  // ── 消费入账协议（CAS fencing） ──
  /** 认领（PENDING->POSTING + claim_token + claim_at，影响 0 行=已被处理） */
  claimForPosting(transferNo: string, claimToken: string, manager?: EntityManager): Promise<ClaimResult>
  /**
   * 执行入账事务（账户按 id 排序锁序防死锁 + 末位 claim_token CAS）
   * @param claimToken 认领令牌（末位 CAS 校验）
   * @returns success=false 且无 error = fencing 失败（已被接管，放弃）
   */
  postTransfer(transferNo: string, claimToken: string, manager?: EntityManager): Promise<PostResult>
  /**
   * 失败回退（POSTING->PENDING + retryCount+1 + nextRetryAt 退避）
   * 带 claim_token 条件，影响 0 行=已被接管->直接放弃
   * @returns affected=0 表示已被接管（不重试、不重入队）
   */
  revertToPending(transferNo: string, claimToken: string, retryCount: number, nextRetryAt: Date, error: string, manager?: EntityManager): Promise<{ affected: number }>
  /** 标记 FAILED（重试耗尽） */
  markFailed(transferNo: string, claimToken: string, error: string, manager?: EntityManager): Promise<{ affected: number }>
  /** 标记入队时间（last_push_at） */
  markEnqueued(transferNo: string, manager?: EntityManager): Promise<void>

  // ── 取消（按 hold_type 分桶回滚预占） ──
  /** 取消（FAILED->CANCELLED + 按 hold_type 回滚预占）；0 行告警 */
  cancel(transferNo: string, operator?: { id?: string; text?: string }, manager?: EntityManager): Promise<{ affected: number; reserveAffected: number }>
  /** 人工重推（FAILED/CANCELLED->PENDING + 重置 retry_count/next_retry_at/claim_token） */
  repost(transferNo: string, manager?: EntityManager): Promise<{ affected: number }>
  /** 批量重推（≤1000） */
  batchRepost(transferNos: string[], manager?: EntityManager): Promise<{ affected: number }>

  // ── 兜底扫描 ──
  /** 扫描需要补发/重置的单（PENDING 入队超时 + POSTING 孤儿） */
  scavenge(now: Date, enqueueTimeoutMs: number, orphanTimeoutMs: number, repushThrottleMs: number, limit: number, manager?: EntityManager): Promise<ScavenigeResult>
  /** 孤儿重置（POSTING->PENDING + claim_token=NULL，条件 claim_at < 超时） */
  resetOrphans(transferNos: string[], manager?: EntityManager): Promise<{ affected: number }>

  // ── 查询 ──
  /** 查交易单 */
  getTransfer(transferNo: string, manager?: EntityManager): Promise<TransferView | null>
  /** 按幂等键查交易单 */
  findTransferByBizRef(bizRef: string, bizType: string, manager?: EntityManager): Promise<TransferView | null>
  /**
   * 流水分页（必带 account_id，单分区裁剪）
   * 契约：返回**富化分录**（EntryView），携带交易单上下文（bizType/description/fromAccountId/toAccounts）
   * 与按账户派生的审核备注（note/noteExtra，取自交易单 accountNotes[accountId]）；实现方式自由（JOIN/反规范化/分片内聚）
   */
  queryEntries(filter: EntryQueryFilter, manager?: EntityManager): Promise<{ items: EntryView[]; total: number }>
  /**
   * 交易单分页
   * 契约：支持 from 侧（fromAccountId/fromAccountType/fromAccountHolderIds）与 to 侧（toAccountId/toHolderId/toHolderIds）
   * 双向过滤；to 侧命中"任一收款方为该账户"的交易单（默认实现经分录表 direction=借 达成）
   */
  queryTransfers(filter: TransferQueryFilter, manager?: EntityManager): Promise<{ items: TransferView[]; total: number }>
  /** 账户分页 */
  queryAccounts(filter: AccountQueryFilter, manager?: EntityManager): Promise<{ items: AccountView[]; total: number }>
  /** 对账报告分页 */
  queryReports(filter: { status?: number; page?: number; pageSize?: number }, manager?: EntityManager): Promise<{ items: any[]; total: number }>
  /**
   * 交易单聚合（COUNT + SUM(amount)，与 queryTransfers 同源过滤条件，含 from/to 双侧）
   * 供读侧汇总（如提现成功金额/笔数）；filter 支持 postStatusExclude 排除口径
   */
  sumTransfers(filter: TransferQueryFilter, manager?: EntityManager): Promise<{ totalCount: number; totalAmount: AmountString }>

  // ── 对账 ──
  /** 计算账户恒等式差异：Σ(signed_amount) vs (balance+frozen+pendingOut) */
  computeReconcileDiffs(accountIds?: string[], manager?: EntityManager): Promise<{ totalAccounts: number; diffs: ReconcileDiffItem[] }>
  /** 增量修复（先锁账户行 -> 重读 Σ -> UPDATE balance + INSERT 调整分录 原子执行 -> 复验） */
  applyFix(accountId: string, operator?: { id?: string; text?: string }, manager?: EntityManager): Promise<{ fixed: boolean; diff: string }>

  // ── 归档（copy-then-delete + 水印，默认 no-op 由业务方调度） ──
  /** 归档分录（created < cutoff 且 updated < cutoff；copy-then-delete 幂等；游标水印分批） */
  archiveEntries(before: Date, batchSize?: number, manager?: EntityManager): Promise<{ archived: number; hasMore: boolean }>
  /** 联动归档交易单（分录归档完成后调用） */
  archiveTransfers(before: Date, batchSize?: number, manager?: EntityManager): Promise<{ archived: number; hasMore: boolean }>
}

/** 开户入参 */
export interface OpenAccountInput {
  holderId: string
  holderType?: string
  tag?: string
  currency?: string
  /** 初始余额（最小单位字符串，同步入账，禁负数） */
  initialBalance?: AmountString
  sysAccountKey?: string
  extra?: Record<string, unknown>
}

/** 兜底扫描结果 */
export interface ScavenigeResult {
  /** 需补发的 PENDING 超时单 */
  pendingTimeout: ScavengeItem[]
  /** 需重置的 POSTING 孤儿单 */
  orphans: ScavengeItem[]
}

/** 流水查询过滤 */
export interface EntryQueryFilter {
  /** 账户ID（**必填**，分区裁剪前提；契约层面约束，无 accountId 视为不支持/全表扫） */
  accountId?: string
  transferNo?: string
  direction?: number
  /** 交易类型筛选（按交易单 bizType 匹配；实现方可经 transferNo JOIN 交易单达成） */
  bizType?: string
  /** 时间范围（必填以利用分区/索引） */
  startDate?: Date
  endDate?: Date
  page?: number
  pageSize?: number
}

/** 交易单查询过滤 */
export interface TransferQueryFilter {
  /** 交易单号精确筛选（管理端按单号定位） */
  transferNo?: string
  /** 业务幂等键精确筛选（管理端按业务幂等键定位；与 bizType 组合唯一） */
  bizRef?: string
  postStatus?: number | number[]
  /** 排除指定入账状态（NOT IN 语义；如成功口径 = postStatus NOT IN (FAILED,CANCELLED,REJECTED)） */
  postStatusExclude?: number[]
  auditStatus?: number | number[]
  bizType?: string
  fromAccountId?: string
  /** 转出账户主体类型等值筛选（JOIN ext_ledger_account，如 holderType='user'） */
  fromAccountType?: string
  /** 转出账户主体 ID 集合筛选（JOIN ext_ledger_account，如用户 ID 列表） */
  fromAccountHolderIds?: string[]
  /**
   * 收款方账户 ID 精确筛选（to 侧）：命中"任一收款方为该账户"的交易单
   * 契约语义：一对多转账中只要某收款方命中即返回该交易单；实现方可经分录表（direction=借 的分录 accountId）达成
   */
  toAccountId?: string
  /** 收款方主体 ID 精确筛选（to 侧，JOIN ext_ledger_account 按 holderId 匹配） */
  toHolderId?: string
  /** 收款方主体 ID 集合筛选（to 侧） */
  toHolderIds?: string[]
  startDate?: Date
  endDate?: Date
  /**
   * 业务扩展字段等值筛选（语义键值，如 { promoterId: 'P888' }）
   * 须配合 bizType 使用（按 bizExtMappings 翻译成预留索引位列查询，走索引）；
   * 未映射/缺 bizType 时抛错
   */
  extFields?: Record<string, string>
  page?: number
  pageSize?: number
}

/** 账户查询过滤 */
export interface AccountQueryFilter {
  /** 账户 ID 精确筛选（管理端按 ID 定位账户） */
  id?: string
  holderId?: string
  tag?: string
  currency?: string
  page?: number
  pageSize?: number
}

/** 冲正记录查询过滤 */
export interface ReversalQueryFilter {
  /** 冲正单号精确筛选 */
  reversalNo?: string
  /** 被冲正的原交易单号精确筛选 */
  originalTransferNo?: string
  /** 冲正操作类型（如 reverse） */
  bizType?: string
  /** 原转出方账户 ID（资金退回目的地） */
  fromAccountId?: string
  startDate?: Date
  endDate?: Date
  page?: number
  pageSize?: number
}

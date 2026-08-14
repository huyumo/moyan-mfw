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
  transfer?: any
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
  /** 开户（幂等：holderId+holderType+tag+currency 命中返回已有）；初始余额同步入账 */
  openAccount(input: OpenAccountInput, manager?: EntityManager): Promise<any>
  /** 查账户 */
  getAccount(accountId: string, manager?: EntityManager): Promise<any | null>
  /** 按 holder + tag + currency 查账户 */
  findAccount(holderId: string, holderType: string, tag: string, currency: string, manager?: EntityManager): Promise<any | null>

  // ── 制单（同步事务：插单 + 预占） ──
  /**
   * 制单（幂等 + 预占）
   * @returns { transfer, created } created=false 表示 bizRef 命中返回已有单
   */
  createTransferWithReserve(input: CreateTransferInput, maker?: { id?: string; text?: string }, manager?: EntityManager): Promise<{ transfer: any; created: boolean }>

  // ── 审核 ──
  /** 审核通过（NOT_READY->PENDING 单条原子写）；驳回（解冻+REJECTED）。返回影响行数 */
  audit(input: AuditTransferInput, auditor?: { id?: string; text?: string }, manager?: EntityManager): Promise<{ affected: number; action: 'approved' | 'rejected' }>

  // ── 冲正 ──
  /** 创建冲正单（原单须 POSTED 且未冲正；唯一索引防双冲正） */
  createReversal(input: ReverseTransferInput, maker?: { id?: string; text?: string }, manager?: EntityManager): Promise<{ transfer: any; created: boolean }>

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
  getTransfer(transferNo: string, manager?: EntityManager): Promise<any | null>
  /** 按幂等键查交易单 */
  findTransferByBizRef(bizRef: string, bizType: string, manager?: EntityManager): Promise<any | null>
  /** 流水分页（必带 account_id，单分区裁剪） */
  queryEntries(filter: EntryQueryFilter, manager?: EntityManager): Promise<{ items: any[]; total: number }>
  /** 交易单分页 */
  queryTransfers(filter: TransferQueryFilter, manager?: EntityManager): Promise<{ items: any[]; total: number }>
  /** 账户分页 */
  queryAccounts(filter: AccountQueryFilter, manager?: EntityManager): Promise<{ items: any[]; total: number }>
  /** 对账报告分页 */
  queryReports(filter: { status?: number; page?: number; pageSize?: number }, manager?: EntityManager): Promise<{ items: any[]; total: number }>

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
  accountId?: string
  transferNo?: string
  direction?: number
  /** 时间范围（必填以利用分区/索引） */
  startDate?: Date
  endDate?: Date
  page?: number
  pageSize?: number
}

/** 交易单查询过滤 */
export interface TransferQueryFilter {
  postStatus?: number | number[]
  auditStatus?: number | number[]
  bizType?: string
  fromAccountId?: string
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
  holderId?: string
  tag?: string
  currency?: string
  page?: number
  pageSize?: number
}

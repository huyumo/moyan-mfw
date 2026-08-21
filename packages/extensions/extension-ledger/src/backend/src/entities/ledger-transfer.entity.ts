/**
 * @fileoverview 交易单实体（不分区，全主键/唯一键点查）
 * @description 制单 + 审核 + 入账状态机载体；幂等键 (bizRef, bizType)
 *
 * synchronize:false —— 表结构一律由 database/migrations 管理（评审 A3 M2）
 * （migration 中 idx_ledger_transfer_post_status 为 (postStatus, createdAt) 组合索引）
 *
 * 状态机（post_status）：
 *   免审制单 -> PENDING（入队）
 *   需审制单 -> NOT_READY（不入队，等待审核）
 *   审核通过 -> NOT_READY -> PENDING（入队，单条原子写）
 *   审核驳回 -> REJECTED（终态，解冻）
 *   消费认领 -> PENDING -> POSTING（claim_token 标记执行者）
 *   入账成功 -> POSTED（末位 claim_token CAS）
 *   重试耗尽 -> FAILED；人工取消 -> CANCELLED；驳回 -> REJECTED
 */

import { Entity, PrimaryColumn, Column, Index, Unique } from 'typeorm'
import { Base } from 'moyan-mfw-base/backend'
import { toDescription } from 'moyan-mfw-base/shared'
import {
  AuditStatusDict,
  PostStatusDict,
  HoldTypeDict,
  TransferModeDict,
} from 'moyan-mfw-extension-ledger/shared'

@Entity('ext_ledger_transfer', { synchronize: false })
@Unique('uk_ledger_transfer_biz_ref', ['bizRef', 'bizType'])
@Unique('uk_ledger_transfer_reversed_from', ['reversedFromTransferNo'])
export class LedgerTransfer extends Base {
  /** 交易单号（主键，日期前缀 + nanoid） */
  @PrimaryColumn({ type: 'varchar', length: 40, comment: '交易单号' })
  transferNo: string

  /** 业务幂等键（与 bizType 组合唯一） */
  @Column({ type: 'varchar', length: 64, comment: '业务幂等键' })
  bizRef: string

  /** 业务类型 */
  @Column({ type: 'varchar', length: 32, comment: '业务类型' })
  bizType: string

  /** 转出方账户 ID */
  @Index('idx_ledger_transfer_from')
  @Column({ type: 'varchar', length: 36, comment: '转出方账户ID' })
  fromAccountId: string

  /** 收款方明细 JSON（最多 100 个，from ∉ to，内部去重） */
  @Column({ type: 'json', comment: '收款方明细' })
  toAccounts: { account: string; amount: string }[]

  /** 流动总金额（bigint 最小单位字符串） */
  @Column({ type: 'bigint', comment: '流动总金额' })
  amount: string

  /** 币种 */
  @Index('idx_ledger_transfer_currency')
  @Column({ type: 'char', length: 4, comment: '币种' })
  currency: string

  /** 转账模式 1=一对一 2=一对多 */
  @Index('idx_ledger_transfer_mode')
  @Column({ type: 'tinyint', default: TransferModeDict.ONE_TO_ONE, comment: toDescription(TransferModeDict) })
  transferMode: number

  /** 是否需要审核 */
  @Index('idx_ledger_transfer_need_review')
  @Column({ type: 'boolean', default: false, comment: '是否需要审核' })
  needReview: boolean

  /** 资金占用桶类型 1=预占在途 2=审核冻结（制单时确定，取消/回滚按桶分支） */
  @Column({ type: 'tinyint', comment: toDescription(HoldTypeDict) })
  holdType: number

  /** 审核状态 1=待审核 2=通过 3=驳回 */
  @Index('idx_ledger_transfer_audit_status')
  @Column({ type: 'tinyint', default: AuditStatusDict.PENDING_REVIEW, comment: toDescription(AuditStatusDict) })
  auditStatus: number

  /** 入账状态（状态机见文件头注释） */
  @Index('idx_ledger_transfer_post_status')
  @Column({ type: 'tinyint', default: PostStatusDict.PENDING, comment: toDescription(PostStatusDict) })
  postStatus: number

  /** 关联业务单号（审计用） */
  @Column({ type: 'varchar', length: 64, nullable: true, comment: '关联业务单号' })
  associatedOrder: string | null

  /** 关联业务表名 */
  @Column({ type: 'varchar', length: 64, nullable: true, comment: '关联业务表名' })
  orderTable: string | null

  /** 重试次数 */
  @Column({ type: 'int', default: 0, comment: '重试次数' })
  retryCount: number

  /** 认领令牌（认领时重新生成 UUID；末位 CAS 校验防双入账） */
  @Column({ type: 'varchar', length: 64, nullable: true, comment: '认领令牌' })
  claimToken: string | null

  /** 认领时间（DB NOW()，孤儿单恢复判定） */
  @Column({ type: 'datetime', nullable: true, comment: '认领时间' })
  claimAt: Date | null

  /** 下次重试时间（退避判定，扫描与认领都检查） */
  @Column({ type: 'datetime', nullable: true, comment: '下次重试时间' })
  nextRetryAt: Date | null

  /** 上次入队时间（扫描重推节流，同单重推 ≥5min） */
  @Column({ type: 'datetime', nullable: true, comment: '上次入队时间' })
  lastPushAt: Date | null

  /** 上次错误信息（FAILED 时记录） */
  @Column({ type: 'text', nullable: true, comment: '上次错误信息' })
  lastError: string | null

  /**
   * 冲正单号（原单被冲正后**永久**记录，用于展示"已冲正"与关联冲正记录；NULL=未被冲正）
   * 防双冲正主约束在 ext_ledger_reversal.originalTransferNo（唯一），本列唯一索引兜底
   */
  @Column({ type: 'varchar', length: 40, nullable: true, comment: '冲正单号（原单被冲正后永久记录；NULL=未被冲正）' })
  reversedFromTransferNo: string | null

  /** 描述/备注 */
  @Column({ type: 'text', nullable: true, comment: '描述' })
  description: string | null

  /** 制单人 ID */
  @Column({ type: 'varchar', length: 36, nullable: true, comment: '制单人ID' })
  makerId: string | null

  /** 制单人名称 */
  @Column({ type: 'varchar', length: 64, nullable: true, comment: '制单人名称' })
  makerText: string | null

  /** 审核人 ID */
  @Column({ type: 'varchar', length: 36, nullable: true, comment: '审核人ID' })
  auditorId: string | null

  /** 审核人名称 */
  @Column({ type: 'varchar', length: 64, nullable: true, comment: '审核人名称' })
  auditorText: string | null

  /** 审核时间 */
  @Column({ type: 'datetime', nullable: true, comment: '审核时间' })
  auditTime: Date | null

  /** 审核备注 */
  @Column({ type: 'text', nullable: true, comment: '审核备注' })
  auditNotes: string | null

  /** 审核按账户备注（accountId -> { note, noteExtra }；审核时写入，流水查询按账户派生） */
  @Column({ type: 'json', nullable: true, comment: '审核账户备注' })
  accountNotes: Record<string, { note?: string; noteExtra?: Record<string, unknown> }> | null

  /** 扩展附录 */
  @Column({ type: 'json', nullable: true, comment: '扩展附录' })
  extra: Record<string, unknown> | null

  // ── 业务扩展预留索引位（ext_col1~4，bizExtMappings 映射；synchronize:false 由 migration 建列） ──
  /** 业务扩展索引位1（bizType 维度语义由 bizExtMappings 定义） */
  @Index('idx_ledger_transfer_ext1')
  @Column({ type: 'varchar', length: 64, nullable: true, comment: '业务扩展索引位1' })
  extCol1: string | null

  /** 业务扩展索引位2 */
  @Index('idx_ledger_transfer_ext2')
  @Column({ type: 'varchar', length: 64, nullable: true, comment: '业务扩展索引位2' })
  extCol2: string | null

  /** 业务扩展索引位3 */
  @Index('idx_ledger_transfer_ext3')
  @Column({ type: 'varchar', length: 64, nullable: true, comment: '业务扩展索引位3' })
  extCol3: string | null

  /** 业务扩展索引位4 */
  @Index('idx_ledger_transfer_ext4')
  @Column({ type: 'varchar', length: 64, nullable: true, comment: '业务扩展索引位4' })
  extCol4: string | null
}

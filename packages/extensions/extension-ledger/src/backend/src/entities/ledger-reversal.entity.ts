/**
 * @fileoverview 冲正记录实体
 * @description 冲正独立落表（不入 ext_ledger_transfer）：不影响制单记录条数、不更新累计转入/转出
 *
 * 冲正语义（全额冲正）：
 *   - 原单各收款方（toAccounts）将其收款金额各自退回原转出方（fromAccountId）
 *   - 冲正为同步事务完成（低频管理操作），成功即 status=POSTED；失败整体回滚无中间态
 *   - 原单 reversedFromTransferNo 永久记录冲正单号（防双冲正唯一约束落在本表 originalTransferNo）
 *
 * synchronize:false —— 表结构一律由 database/migrations 管理（评审 A3 M2）
 */
import { Entity, PrimaryColumn, Column, Index, Unique } from 'typeorm'
import { Base } from 'moyan-mfw-base/backend'
import { ReversalStatusDict } from 'moyan-mfw-extension-ledger/shared'

@Entity('ext_ledger_reversal', { synchronize: false })
@Unique('uk_ledger_reversal_biz_ref', ['bizRef', 'bizType'])
export class LedgerReversal extends Base {
  /** 冲正单号（主键，R 前缀） */
  @PrimaryColumn({ type: 'varchar', length: 40, comment: '冲正单号' })
  reversalNo: string

  /** 被冲正的原交易单号（唯一：一张原单至多一次冲正，防双冲正） */
  @Index('uk_ledger_reversal_original', { unique: true })
  @Column({ type: 'varchar', length: 40, comment: '被冲正的原交易单号' })
  originalTransferNo: string

  /** 业务幂等键（与 bizType 组合唯一，客户端重试返回已有记录） */
  @Column({ type: 'varchar', length: 64, comment: '业务幂等键' })
  bizRef: string

  /** 业务类型（冲正操作类型，如 reverse） */
  @Column({ type: 'varchar', length: 32, comment: '业务类型' })
  bizType: string

  /** 币种 */
  @Column({ type: 'char', length: 4, comment: '币种' })
  currency: string

  /** 冲正总金额（bigint 最小单位字符串，= Σ toAccounts.amount） */
  @Column({ type: 'bigint', comment: '冲正总金额' })
  amount: string

  /** 原转出方账户 ID（资金退回目的地） */
  @Index('idx_ledger_reversal_from')
  @Column({ type: 'varchar', length: 36, comment: '原转出方账户ID（资金退回目的地）' })
  fromAccountId: string

  /** 原收款方明细（冲正后各自退回其金额） */
  @Column({ type: 'json', comment: '原收款方明细' })
  toAccounts: { account: string; amount: string }[]

  /** 冲正状态（同步事务成功即 POSTED=1，无中间态） */
  @Column({ type: 'tinyint', default: ReversalStatusDict.POSTED, comment: '冲正状态: 1=已冲正' })
  status: number

  /** 描述/备注 */
  @Column({ type: 'text', nullable: true, comment: '描述' })
  description: string | null

  /** 制单人 ID */
  @Column({ type: 'varchar', length: 36, nullable: true, comment: '制单人ID' })
  makerId: string | null

  /** 制单人名称 */
  @Column({ type: 'varchar', length: 64, nullable: true, comment: '制单人名称' })
  makerText: string | null

  /** 扩展附录 */
  @Column({ type: 'json', nullable: true, comment: '扩展附录' })
  extra: Record<string, unknown> | null
}

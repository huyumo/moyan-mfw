/**
 * @fileoverview 分录（流水）实体 -- 不继承 Base，KEY(account_id) 64 分区
 *
 * 设计要点（评审修正）：
 *   1. 不继承框架 Base：流水落账后不可变（冲正=新增反向分录，绝不 UPDATE 旧行），
 *      软删语义冲突且 updateAt nullable 怪癖会污染归档哨兵判断
 *   2. 复合主键 (id, account_id)：id bigint 自增（必须显式 type:'bigint'，否则 TypeORM 默认 int 会 21 亿溢出）
 *   3. PARTITION BY KEY(account_id) PARTITIONS 64：分区键须进主键，自增列须为索引首列--此列序是 MySQL 规则下唯一合法形态
 *   4. @Entity({ synchronize: false })：TypeORM 零分区感知，synchronize 会丢分区；分区表只由手写 migration 管理
 *   5. entry_no 不做全局唯一约束：MySQL 分区表无法建全局唯一键（唯一键须含分区列）
 *   6. created/updated 用 DB 时钟（@CreateDateColumn 用应用时钟，多实例需 NTP；migration 用 DEFAULT CURRENT_TIMESTAMP 兜底）
 */

import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, Index } from 'typeorm'
import { toDescription } from 'moyan-mfw-base/shared'
import { DirectionDict } from 'moyan-mfw-extension-ledger/shared'

@Entity('ext_ledger_entry', { synchronize: false })
export class LedgerEntry {
  /** 自增 ID（bigint，复合主键首列） */
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '自增ID' })
  id: string

  /** 账户 ID（分区键，复合主键第二列） */
  @PrimaryColumn({ type: 'varchar', length: 36, comment: '账户ID' })
  accountId: string

  /** 分录单号（transferNo + D/C 序号） */
  @Column({ type: 'varchar', length: 48, comment: '分录单号' })
  entryNo: string

  /** 关联交易单号 */
  @Index('idx_ledger_entry_transfer')
  @Column({ type: 'varchar', length: 40, comment: '关联交易单号' })
  transferNo: string

  /** 借贷方向 1=借 2=贷 */
  @Column({ type: 'tinyint', comment: toDescription(DirectionDict) })
  direction: number

  /** 符号金额（借为正、贷为负，bigint 最小单位字符串） */
  @Column({ type: 'bigint', comment: '符号金额（借正贷负）' })
  signedAmount: string

  /** 变更前余额 */
  @Column({ type: 'bigint', nullable: true, comment: '变更前余额' })
  balanceBefore: string | null

  /** 变更后余额 */
  @Column({ type: 'bigint', nullable: true, comment: '变更后余额' })
  balanceAfter: string | null

  /** 币种（入账时从交易单带入；金额展示/格式化依赖，ITG/CNY 小数位不同） */
  @Column({ type: 'char', length: 4, nullable: true, comment: '币种' })
  currency: string | null

  /** 扩展附录 */
  @Column({ type: 'json', nullable: true, comment: '扩展附录' })
  extra: Record<string, unknown> | null

  /**
   * 是否冲正腿（1=冲正产生的反向分录，挂原单 transferNo；0/NULL=正常业务分录）
   * 汇总收入/支出（按 direction 聚合）与 to 侧过滤时须排除冲正腿
   */
  @Column({ type: 'tinyint', default: 0, comment: '是否冲正腿: 1=是 0=否' })
  isReversal: number

  /** 创建时间（DB 时钟） */
  @Index('idx_ledger_entry_created')
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', comment: '创建时间' })
  createdAt: Date
}

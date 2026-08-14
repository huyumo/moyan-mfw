/**
 * @fileoverview 对账报告实体
 * @description 对账（手动触发或业务方对接 extension-scheduler 定时调度）产生的差异报告
 */

import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'
import { Base } from 'moyan-mfw-base/backend'
import type { ReconcileDiffItem } from '../spi/interfaces'

/** 差异账户明细项（类型别名，源自 SPI 接口定义） */
export type { ReconcileDiffItem }

/**
 * 对账报告实体
 * @description synchronize:false —— 表结构一律由 database/migrations 管理（评审 A3 M2）
 */
@Entity('ext_ledger_reconcile_report', { synchronize: false })
export class LedgerReconcileReport extends Base {
  @PrimaryGeneratedColumn('uuid', { comment: '主键ID' })
  id: string

  /** 触发方式 1=手动 2=外部调度 */
  @Index('idx_ledger_reconcile_trigger')
  @Column({ type: 'tinyint', default: 1, comment: '触发方式: 1=手动 2=外部调度' })
  triggerType: number

  /** 触发人 ID */
  @Column({ type: 'varchar', length: 36, nullable: true, comment: '触发人ID' })
  triggerBy: string | null

  /** 检查账户总数 */
  @Column({ type: 'int', default: 0, comment: '检查账户总数' })
  totalAccounts: number

  /** 差异账户数 */
  @Column({ type: 'int', default: 0, comment: '差异账户数' })
  diffCount: number

  /** 差异明细 JSON */
  @Column({ type: 'json', nullable: true, comment: '差异明细' })
  diffs: ReconcileDiffItem[] | null

  /** 状态 1=差异待处理 2=已处理 */
  @Index('idx_ledger_reconcile_status')
  @Column({ type: 'tinyint', default: 1, comment: '状态: 1=差异待处理 2=已处理' })
  status: number

  /** 操作人（修复时记录） */
  @Column({ type: 'varchar', length: 36, nullable: true, comment: '操作人' })
  operatorId: string | null

  /** 备注 */
  @Column({ type: 'text', nullable: true, comment: '备注' })
  notes: string | null
}

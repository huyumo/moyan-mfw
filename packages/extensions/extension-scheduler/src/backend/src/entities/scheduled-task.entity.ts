/**
 * @fileoverview 定时任务定义实体
 * @description 定义 Cron 周期任务和延迟任务的配置
 */

import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'
import { Base } from 'moyan-mfw-base/backend'
import { toDescription } from 'moyan-mfw-base/shared'
import { TaskTypeDict, TaskRunStatusDict } from 'moyan-mfw-extension-scheduler/shared'

@Entity('ext_scheduler_task')
@Index('idx_scheduler_task_code', ['taskCode'], { unique: true })
export class ScheduledTaskDefinition extends Base {
  @PrimaryGeneratedColumn('uuid', { comment: '主键ID' })
  id: string

  @Column({ type: 'varchar', length: 128, comment: '任务编码（唯一标识）' })
  taskCode: string

  @Column({ type: 'varchar', length: 128, comment: '任务名称' })
  taskName: string

  @Column({ type: 'tinyint', default: TaskTypeDict.CRON, comment: toDescription(TaskTypeDict) })
  taskType: number

  @Column({ type: 'varchar', length: 128, nullable: true, comment: 'Cron表达式（6段秒级，与intervalSeconds二选一）' })
  cronExpression: string | null

  @Column({ type: 'int', default: 0, comment: '固定间隔秒数（与cron二选一，0=使用cron）' })
  intervalSeconds: number

  @Column({ type: 'boolean', default: true, comment: '是否启用' })
  enabled: boolean

  @Column({ type: 'int', default: 300, comment: '单次执行超时秒数' })
  timeoutSeconds: number

  @Column({ type: 'text', nullable: true, comment: '任务描述' })
  description: string | null

  @Column({ type: 'boolean', default: false, comment: '重启后是否补偿执行' })
  catchUpOnRestart: boolean

  // ── 重试配置（可由前端编辑，覆盖 handler 默认值） ──

  @Column({ type: 'int', default: 3, comment: '最大重试次数（0=不重试）' })
  maxRetry: number

  @Column({ type: 'text', nullable: true, comment: '退避策略JSON：{"type":"fixed","delays":[60000,300000,3600000,86400000]}' })
  backoffStrategy: string | null

  @Column({ type: 'boolean', default: true, comment: '是否记录执行日志（高频任务可关闭）' })
  enableLog: boolean

  // ── 运行时状态（引擎更新，非人工编辑） ──

  @Column({ type: 'datetime', nullable: true, comment: '上次执行时间' })
  lastRunAt: Date | null

  @Column({ type: 'datetime', nullable: true, comment: '下次执行时间' })
  nextRunAt: Date | null

  @Column({ type: 'tinyint', nullable: true, comment: toDescription(TaskRunStatusDict) })
  lastRunStatus: number | null

  @Column({ type: 'text', nullable: true, comment: '上次错误信息' })
  lastErrorMessage: string | null

  // ── CRON 多实例抢占锁（引擎维护，非人工编辑） ──

  @Column({ type: 'datetime', nullable: true, comment: 'CRON抢占锁到期时间' })
  cronLockUntil: Date | null

  @Column({ type: 'varchar', length: 64, nullable: true, comment: 'CRON抢占锁令牌' })
  cronLockToken: string | null
}

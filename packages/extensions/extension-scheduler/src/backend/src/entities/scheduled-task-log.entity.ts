/**
 * @fileoverview 定时任务执行日志实体
 * @description 记录每次任务执行的详细信息
 */

import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'
import { Base } from 'moyan-mfw-base/backend'
import { toDescription } from 'moyan-mfw-base/shared'
import { TaskRunStatusDict, TaskTriggerTypeDict } from 'moyan-mfw-extension-scheduler/shared'

@Entity('ext_scheduler_task_log')
@Index('idx_task_log_code', ['taskCode'])
@Index('idx_task_log_status', ['status'])
@Index('idx_task_log_startedAt', ['startedAt'])
export class ScheduledTaskLog extends Base {
  @PrimaryGeneratedColumn('uuid', { comment: '主键ID' })
  id: string

  @Column({ type: 'varchar', length: 128, comment: '任务编码' })
  taskCode: string

  @Column({ type: 'varchar', length: 128, comment: '任务名称' })
  taskName: string

  @Column({ type: 'varchar', length: 36, nullable: true, comment: '延迟实例ID（DELAY类型）' })
  instanceId: string | null

  @Column({ type: 'tinyint', default: TaskRunStatusDict.RUNNING, comment: toDescription(TaskRunStatusDict) })
  status: number

  @Column({ type: 'tinyint', default: TaskTriggerTypeDict.AUTO, comment: toDescription(TaskTriggerTypeDict) })
  triggerType: number

  @Column({ type: 'datetime', comment: '开始时间' })
  startedAt: Date

  @Column({ type: 'datetime', nullable: true, comment: '完成时间' })
  finishedAt: Date | null

  @Column({ type: 'int', default: 0, comment: '执行耗时（毫秒）' })
  durationMs: number

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '执行实例标识' })
  executor: string | null

  @Column({ type: 'text', nullable: true, comment: '错误信息' })
  errorMessage: string | null

  @Column({ type: 'text', nullable: true, comment: '错误堆栈' })
  errorStack: string | null

  @Column({ type: 'json', nullable: true, comment: '执行结果摘要' })
  result: Record<string, any> | null
}

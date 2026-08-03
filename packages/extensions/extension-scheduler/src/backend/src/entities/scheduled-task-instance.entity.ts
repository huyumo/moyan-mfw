/**
 * @fileoverview 定时任务实例实体
 * @description 延迟任务的执行实例，支撑上万规模的任务调度
 */

import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'
import { Base } from 'moyan-mfw-base/backend'
import { toDescription } from 'moyan-mfw-base/shared'
import { TaskInstanceStatusDict, TaskTriggerTypeDict } from 'moyan-mfw-extension-scheduler/shared'

@Entity('ext_scheduler_task_instance')
@Index('idx_task_instance_scan', ['status', 'executeAt'])
@Index('idx_task_instance_archive', ['executor', 'status'])
@Index('idx_task_instance_code', ['taskCode'])
@Index('idx_task_instance_entity', ['entityId'])
export class ScheduledTaskInstance extends Base {
  @PrimaryGeneratedColumn('uuid', { comment: '主键ID' })
  id: string

  @Column({ type: 'varchar', length: 128, comment: '任务编码' })
  taskCode: string

  @Column({ type: 'varchar', length: 128, nullable: true, comment: '业务实体ID（如订单号）' })
  entityId: string | null

  @Column({ type: 'json', nullable: true, comment: '业务数据（派发时携带）' })
  payload: Record<string, any> | null

  @Column({ type: 'datetime', comment: '应执行时间（精确到秒）' })
  executeAt: Date

  @Column({ type: 'tinyint', default: TaskInstanceStatusDict.PENDING, comment: toDescription(TaskInstanceStatusDict) })
  status: number

  @Column({ type: 'datetime', nullable: true, comment: '开始执行时间' })
  startedAt: Date | null

  @Column({ type: 'datetime', nullable: true, comment: '完成时间' })
  finishedAt: Date | null

  @Column({ type: 'int', default: 0, comment: '重试次数' })
  retryCount: number

  @Column({ type: 'text', nullable: true, comment: '错误信息' })
  errorMessage: string | null

  @Column({ type: 'text', nullable: true, comment: '错误堆栈' })
  errorStack: string | null

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '执行实例标识（hostname-pid）' })
  executor: string | null

  @Column({ type: 'tinyint', default: TaskTriggerTypeDict.AUTO, comment: toDescription(TaskTriggerTypeDict) })
  triggerType: number
}

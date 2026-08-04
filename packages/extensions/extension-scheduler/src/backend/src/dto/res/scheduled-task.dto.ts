/**
 * @fileoverview 定时任务响应 DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

/** 任务定义响应 DTO */
export class ScheduledTaskResponseDto {
  @ApiProperty({ description: '主键ID' })
  @Expose()
  id: string

  @ApiProperty({ description: '任务编码' })
  @Expose()
  taskCode: string

  @ApiProperty({ description: '任务名称' })
  @Expose()
  taskName: string

  @ApiProperty({ description: '任务类型: 1=Cron 2=延迟' })
  @Expose()
  taskType: number

  @ApiPropertyOptional({ description: 'Cron表达式' })
  @Expose()
  cronExpression: string | null

  @ApiPropertyOptional({ description: '固定间隔秒数' })
  @Expose()
  intervalSeconds: number

  @ApiProperty({ description: '是否启用' })
  @Expose()
  enabled: boolean

  @ApiProperty({ description: '超时秒数' })
  @Expose()
  timeoutSeconds: number

  @ApiPropertyOptional({ description: '任务描述' })
  @Expose()
  description: string | null

  @ApiPropertyOptional({ description: '重启补偿' })
  @Expose()
  catchUpOnRestart: boolean

  @ApiPropertyOptional({ description: '上次执行时间' })
  @Expose()
  lastRunAt: Date | null

  @ApiPropertyOptional({ description: '下次执行时间' })
  @Expose()
  nextRunAt: Date | null

  @ApiPropertyOptional({ description: '上次执行状态' })
  @Expose()
  lastRunStatus: number | null

  @ApiPropertyOptional({ description: '上次错误信息' })
  @Expose()
  lastErrorMessage: string | null

  @ApiPropertyOptional({ description: '创建时间' })
  @Expose()
  createdAt: Date

  @ApiPropertyOptional({ description: '更新时间' })
  @Expose()
  updateAt: Date
}

/** 任务实例响应 DTO */
export class ScheduledTaskInstanceResponseDto {
  @ApiProperty({ description: '主键ID' })
  @Expose()
  id: string

  @ApiProperty({ description: '任务编码' })
  @Expose()
  taskCode: string

  @ApiPropertyOptional({ description: '任务名称（关联任务定义）' })
  @Expose()
  taskName: string | null

  @ApiPropertyOptional({ description: '任务类型：1=Cron定时 2=延迟任务' })
  @Expose()
  taskType: number | null

  @ApiPropertyOptional({ description: '触发方式：1=自动 2=手动' })
  @Expose()
  triggerType: number | null

  @ApiPropertyOptional({ description: '业务实体ID' })
  @Expose()
  entityId: string | null

  @ApiPropertyOptional({ description: '业务数据' })
  @Expose()
  payload: Record<string, any> | null

  @ApiProperty({ description: '应执行时间' })
  @Expose()
  executeAt: Date

  @ApiProperty({ description: '实例状态' })
  @Expose()
  status: number

  @ApiPropertyOptional({ description: '重试次数' })
  @Expose()
  retryCount: number

  @ApiPropertyOptional({ description: '执行实例标识（分布式协调用）' })
  @Expose()
  executor: string | null
}

/** 任务执行日志响应 DTO */
export class ScheduledTaskLogResponseDto {
  @ApiProperty({ description: '主键ID' })
  @Expose()
  id: string

  @ApiProperty({ description: '任务编码' })
  @Expose()
  taskCode: string

  @ApiProperty({ description: '任务名称' })
  @Expose()
  taskName: string

  @ApiPropertyOptional({ description: '延迟实例ID' })
  @Expose()
  instanceId: string | null

  @ApiProperty({ description: '执行状态' })
  @Expose()
  status: number

  @ApiProperty({ description: '触发方式' })
  @Expose()
  triggerType: number

  @ApiProperty({ description: '开始时间' })
  @Expose()
  startedAt: Date

  @ApiPropertyOptional({ description: '完成时间' })
  @Expose()
  finishedAt: Date | null

  @ApiPropertyOptional({ description: '耗时毫秒' })
  @Expose()
  durationMs: number

  @ApiPropertyOptional({ description: '执行实例标识' })
  @Expose()
  executor: string | null

  @ApiPropertyOptional({ description: '错误信息' })
  @Expose()
  errorMessage: string | null

  @ApiPropertyOptional({ description: '错误堆栈' })
  @Expose()
  errorStack: string | null

  @ApiPropertyOptional({ description: '执行结果摘要' })
  @Expose()
  result: Record<string, any> | null
}

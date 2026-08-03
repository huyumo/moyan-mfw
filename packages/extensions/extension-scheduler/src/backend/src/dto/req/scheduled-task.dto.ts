/**
 * @fileoverview 定时任务请求 DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString, IsInt, IsBoolean, Min, IsObject } from 'class-validator'
import { PaginationQueryDto } from 'moyan-mfw-base/backend'

/** 更新任务定义 DTO（taskName/taskType/taskCode 由代码注册定义，不可修改） */
export class UpdateTaskDto {
  @ApiPropertyOptional({ description: 'Cron表达式（6段秒级，仅CRON类型）' })
  @IsOptional()
  @IsString()
  cronExpression?: string

  @ApiPropertyOptional({ description: '固定间隔秒数（仅CRON类型）' })
  @IsOptional()
  @IsInt()
  @Min(0)
  intervalSeconds?: number

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean

  @ApiPropertyOptional({ description: '超时秒数' })
  @IsOptional()
  @IsInt()
  @Min(1)
  timeoutSeconds?: number

  @ApiPropertyOptional({ description: '任务描述' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: '重启后是否补偿执行（仅CRON类型）' })
  @IsOptional()
  @IsBoolean()
  catchUpOnRestart?: boolean

  @ApiPropertyOptional({ description: '最大重试次数（0=不重试）' })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxRetry?: number

  @ApiPropertyOptional({
    description: '退避策略JSON，如 {"type":"fixed","delays":[60000,300000,3600000,86400000]}',
  })
  @IsOptional()
  @IsObject()
  backoffStrategy?: { type: string; delays?: number[]; base?: number; max?: number; multiplier?: number; interval?: number; increment?: number }

  @ApiPropertyOptional({ description: '是否记录执行日志（高频任务可关闭）' })
  @IsOptional()
  @IsBoolean()
  enableLog?: boolean
}

/** 创建延迟任务实例 DTO（delaySeconds=0 或省略时立即执行） */
export class CreateDelayInstanceDto {
  @ApiProperty({ description: '任务编码' })
  @IsNotEmpty()
  @IsString()
  taskCode: string

  @ApiPropertyOptional({ description: '应执行时间（ISO 字符串），与 delaySeconds 二选一' })
  @IsOptional()
  @IsString()
  executeAt?: string

  @ApiPropertyOptional({ description: '延迟秒数（默认0=立即执行）' })
  @IsOptional()
  @IsInt()
  @Min(0)
  delaySeconds?: number

  @ApiPropertyOptional({ description: '业务实体ID' })
  @IsOptional()
  @IsString()
  entityId?: string

  @ApiPropertyOptional({ description: '业务数据' })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>
}

/** 任务定义查询 DTO */
export class TaskQueryDto {
  @ApiPropertyOptional({ description: '任务名称（模糊匹配）' })
  @IsOptional()
  @IsString()
  taskName?: string

  @ApiPropertyOptional({ description: '任务类型：1=Cron定时 2=延迟任务' })
  @IsOptional()
  @IsInt()
  taskType?: number
}

/** 实例查询 DTO */
export class InstanceQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '任务编码' })
  @IsOptional()
  @IsString()
  taskCode?: string

  @ApiPropertyOptional({ description: '实例状态' })
  @IsOptional()
  @IsInt()
  status?: number

  @ApiPropertyOptional({ description: '业务实体ID' })
  @IsOptional()
  @IsString()
  entityId?: string

  @ApiPropertyOptional({ description: '开始时间' })
  @IsOptional()
  @IsString()
  startTime?: string

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  @IsString()
  endTime?: string
}

/** 日志查询 DTO */
export class LogQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '任务编码' })
  @IsOptional()
  @IsString()
  taskCode?: string

  @ApiPropertyOptional({ description: '执行状态' })
  @IsOptional()
  @IsInt()
  status?: number

  @ApiPropertyOptional({ description: '触发方式' })
  @IsOptional()
  @IsInt()
  triggerType?: number

  @ApiPropertyOptional({ description: '实例ID（精确匹配）' })
  @IsOptional()
  @IsString()
  instanceId?: string

  @ApiPropertyOptional({ description: '开始时间' })
  @IsOptional()
  @IsString()
  startTime?: string

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  @IsString()
  endTime?: string
}

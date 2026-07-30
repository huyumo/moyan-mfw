/**
 * @fileoverview 定时任务请求 DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString, IsInt, IsBoolean, Min, IsObject } from 'class-validator'
import { PaginationQueryDto } from 'moyan-mfw-base/backend'

/** 更新任务定义 DTO */
export class UpdateTaskDto {
  @ApiPropertyOptional({ description: '任务名称' })
  @IsOptional()
  @IsString()
  taskName?: string

  @ApiPropertyOptional({ description: 'Cron表达式（6段秒级）' })
  @IsOptional()
  @IsString()
  cronExpression?: string

  @ApiPropertyOptional({ description: '固定间隔秒数' })
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

  @ApiPropertyOptional({ description: '重启后是否补偿执行' })
  @IsOptional()
  @IsBoolean()
  catchUpOnRestart?: boolean
}

/** 手动触发任务 DTO */
export class TriggerTaskDto {
  @ApiPropertyOptional({ description: '业务数据' })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>
}

/** 创建延迟任务实例 DTO */
export class CreateDelayInstanceDto {
  @ApiProperty({ description: '任务编码' })
  @IsNotEmpty()
  @IsString()
  taskCode: string

  @ApiProperty({ description: '应执行时间（ISO 字符串）' })
  @IsNotEmpty()
  @IsString()
  executeAt: string

  @ApiPropertyOptional({ description: '业务实体ID' })
  @IsOptional()
  @IsString()
  entityId?: string

  @ApiPropertyOptional({ description: '业务数据' })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>
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

  @ApiPropertyOptional({ description: '开始时间' })
  @IsOptional()
  @IsString()
  startTime?: string

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  @IsString()
  endTime?: string
}

/**
 * @fileoverview 调度器全局配置 DTO
 */

import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsBoolean, IsInt, Min } from 'class-validator'
import { CrashRecoveryStrategyDict } from 'moyan-mfw-extension-scheduler/shared'

/** 更新调度器全局配置 DTO */
export class UpdateSchedulerConfigDto {
  @ApiPropertyOptional({ description: '是否启用定期清理' })
  @IsOptional()
  @IsBoolean()
  cleanupEnabled?: boolean

  @ApiPropertyOptional({ description: '终态实例保留天数（超过自动硬删除）' })
  @IsOptional()
  @IsInt()
  @Min(1)
  instanceRetentionDays?: number

  @ApiPropertyOptional({ description: '执行日志保留天数' })
  @IsOptional()
  @IsInt()
  @Min(1)
  logRetentionDays?: number

  @ApiPropertyOptional({ description: '清理间隔（小时）' })
  @IsOptional()
  @IsInt()
  @Min(1)
  cleanupIntervalHours?: number

  @ApiPropertyOptional({
    description: `崩溃恢复策略：${CrashRecoveryStrategyDict.REQUEUE}=重新入队 ${CrashRecoveryStrategyDict.MARK_FAILED}=标记失败 ${CrashRecoveryStrategyDict.MARK_TIMEOUT_ORPHAN}=标记未归档`,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  crashRecoveryStrategy?: number

  @ApiPropertyOptional({ description: '孤儿判定超时秒数（心跳离线阈值）' })
  @IsOptional()
  @IsInt()
  @Min(60)
  orphanTimeoutSeconds?: number

  @ApiPropertyOptional({ description: '重启限流批次大小（每轮预加载上限）' })
  @IsOptional()
  @IsInt()
  @Min(1)
  restartBatchSize?: number

  @ApiPropertyOptional({ description: '重启限流批次间隔（毫秒）' })
  @IsOptional()
  @IsInt()
  @Min(100)
  restartBatchDelayMs?: number

  @ApiPropertyOptional({ description: 'CRON多实例去重开关' })
  @IsOptional()
  @IsBoolean()
  cronDedupEnabled?: boolean
}

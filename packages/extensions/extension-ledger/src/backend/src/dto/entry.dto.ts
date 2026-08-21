/**
 * @fileoverview 流水查询 DTO（导出强制时间范围防全分区扫描）
 */

import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsNumber, IsDateString, IsInt } from 'class-validator'

export class QueryEntryDto {
  @ApiPropertyOptional({ description: '账户ID（必带以单分区裁剪）' })
  @IsOptional()
  @IsString()
  accountId?: string

  @ApiPropertyOptional({ description: '交易单号' })
  @IsOptional()
  @IsString()
  transferNo?: string

  @ApiPropertyOptional({ description: '借贷方向 1=借 2=贷' })
  @IsOptional()
  @IsNumber()
  direction?: number

  @ApiPropertyOptional({ description: '交易类型（按交易单 bizType 过滤；须带 accountId）' })
  @IsOptional()
  @IsString()
  bizType?: string

  @ApiPropertyOptional({ description: '起始时间（导出强制必填，单次最多31天）' })
  @IsOptional()
  @IsDateString()
  startDate?: string

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  @IsDateString()
  endDate?: string

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsInt()
  page?: number

  @ApiPropertyOptional({ description: '每页条数', default: 20 })
  @IsOptional()
  @IsInt()
  pageSize?: number
}

/** 对账触发 DTO */
export class ReconcileTriggerDto {
  @ApiPropertyOptional({ description: '指定账户ID列表（不传则全量）' })
  @IsOptional()
  accountIds?: string[]
}

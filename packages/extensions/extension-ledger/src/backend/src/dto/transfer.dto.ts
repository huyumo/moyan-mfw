/**
 * @fileoverview 交易单相关 DTO（金额一律 string 传输，防 bigint 精度丢失）
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsNotEmpty, Matches, IsBoolean, ValidateNested, ArrayMaxSize, ArrayMinSize, IsIn, IsInt, IsArray } from 'class-validator'
import { Type } from 'class-transformer'

/** 收款方明细 DTO */
export class TransferTargetDto {
  @ApiProperty({ description: '收款方账户ID' })
  @IsString()
  @IsNotEmpty()
  account: string

  @ApiProperty({ description: '转入金额（最小单位字符串，须为正整数）' })
  @IsString()
  @Matches(/^[1-9]\d*$/, { message: '金额须为正整数字符串' })
  amount: string
}

/** 制单 DTO */
export class CreateTransferDto {
  @ApiProperty({ description: '业务幂等键（同 bizRef+bizType 重复制单返回已有单）' })
  @IsString()
  @IsNotEmpty()
  bizRef: string

  @ApiProperty({ description: '业务类型' })
  @IsString()
  @IsNotEmpty()
  bizType: string

  @ApiProperty({ description: '转出方账户ID' })
  @IsString()
  @IsNotEmpty()
  fromAccount: string

  @ApiProperty({ description: '收款方明细', type: [TransferTargetDto] })
  @ValidateNested({ each: true })
  @Type(() => TransferTargetDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  toAccounts: TransferTargetDto[]

  @ApiProperty({ description: '流动总金额（最小单位字符串，须等于 Σ toAccounts.amount）' })
  @IsString()
  @Matches(/^[1-9]\d*$/, { message: '金额须为正整数字符串' })
  amount: string

  @ApiProperty({ description: '币种' })
  @IsString()
  @IsNotEmpty()
  currency: string

  @ApiProperty({ description: '是否需要审核（true: 制单后冻结待审；false: 直接预占入队）' })
  @IsBoolean()
  needReview: boolean

  @ApiPropertyOptional({ description: '关联业务单号' })
  @IsOptional()
  @IsString()
  associatedOrder?: string

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: '扩展附录' })
  @IsOptional()
  extra?: Record<string, unknown>

  @ApiPropertyOptional({ description: '扩展筛选字段（语义键值，经 bizExtMappings 映射写预留索引位）' })
  @IsOptional()
  extFields?: Record<string, string>
}

/** 审核 DTO */
export class AuditTransferDto {
  @ApiProperty({ description: '交易单号' })
  @IsString()
  @IsNotEmpty()
  transferNo: string

  @ApiProperty({ description: '1=通过 2=驳回' })
  @IsIn([1, 2], { message: 'auditStatus 必须为 1(通过) 或 2(驳回)' })
  auditStatus: 1 | 2

  @ApiPropertyOptional({ description: '审核备注' })
  @IsOptional()
  @IsString()
  auditNotes?: string
}

/** 冲正 DTO */
export class ReverseTransferDto {
  @ApiProperty({ description: '被冲正的原交易单号' })
  @IsString()
  @IsNotEmpty()
  originalTransferNo: string

  @ApiProperty({ description: '冲正单业务幂等键' })
  @IsString()
  @IsNotEmpty()
  bizRef: string

  @ApiProperty({ description: '业务类型' })
  @IsString()
  @IsNotEmpty()
  bizType: string

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: '扩展附录' })
  @IsOptional()
  extra?: Record<string, unknown>
}

/** 交易单查询 DTO */
export class QueryTransferDto {
  @ApiPropertyOptional({ description: '入账状态（可逗号分隔多个）' })
  @IsOptional()
  @IsString()
  postStatus?: string

  @ApiPropertyOptional({ description: '审核状态' })
  @IsOptional()
  @IsInt()
  auditStatus?: number

  @ApiPropertyOptional({ description: '业务类型' })
  @IsOptional()
  @IsString()
  bizType?: string

  @ApiPropertyOptional({ description: '转出方账户ID' })
  @IsOptional()
  @IsString()
  fromAccountId?: string

  @ApiPropertyOptional({
    description: '业务扩展字段等值筛选（JSON 字符串，须配 bizType；如 {"promoterId":"P888"}）',
  })
  @IsOptional()
  @IsString()
  extFields?: string

  @ApiPropertyOptional({ description: '起始时间' })
  @IsOptional()
  startDate?: Date

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  endDate?: Date

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsInt()
  page?: number

  @ApiPropertyOptional({ description: '每页条数', default: 20 })
  @IsOptional()
  @IsInt()
  pageSize?: number
}

/** 批量重推 DTO */
export class BatchRepostDto {
  @ApiProperty({ description: '交易单号列表（≤1000）', type: [String] })
  @IsArray()
  @ArrayMaxSize(1000)
  @ArrayMinSize(1)
  transferNos: string[]
}

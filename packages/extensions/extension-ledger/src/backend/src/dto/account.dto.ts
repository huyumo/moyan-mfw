/**
 * @fileoverview 账户相关 DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsNotEmpty, Matches, IsInt } from 'class-validator'

/** 开户 DTO */
export class OpenAccountDto {
  @ApiProperty({ description: '持有者ID' })
  @IsString()
  @IsNotEmpty()
  holderId: string

  @ApiPropertyOptional({ description: '持有者表名', default: 'system' })
  @IsOptional()
  @IsString()
  holderType?: string

  @ApiPropertyOptional({ description: '账户标签', default: 'default' })
  @IsOptional()
  @IsString()
  tag?: string

  @ApiPropertyOptional({ description: '币种', default: 'CNY' })
  @IsOptional()
  @IsString()
  currency?: string

  @ApiPropertyOptional({ description: '初始余额（最小单位字符串，须为正整数）' })
  @IsOptional()
  @IsString()
  @Matches(/^[1-9]\d*$/, { message: '初始余额须为正整数字符串' })
  initialBalance?: string

  @ApiPropertyOptional({ description: '系统账号key' })
  @IsOptional()
  @IsString()
  sysAccountKey?: string

  @ApiPropertyOptional({ description: '扩展附录' })
  @IsOptional()
  extra?: Record<string, unknown>
}

/** 账户查询 DTO */
export class QueryAccountDto {
  @ApiPropertyOptional({ description: '账户ID（精确筛选）' })
  @IsOptional()
  @IsString()
  id?: string

  @ApiPropertyOptional({ description: '持有者ID' })
  @IsOptional()
  @IsString()
  holderId?: string

  @ApiPropertyOptional({ description: '账户标签' })
  @IsOptional()
  @IsString()
  tag?: string

  @ApiPropertyOptional({ description: '币种' })
  @IsOptional()
  @IsString()
  currency?: string

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsInt()
  page?: number

  @ApiPropertyOptional({ description: '每页条数', default: 20 })
  @IsOptional()
  @IsInt()
  pageSize?: number
}

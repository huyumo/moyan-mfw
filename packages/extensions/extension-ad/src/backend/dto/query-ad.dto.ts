/**
 * @fileoverview 广告内容查询参数 DTO
 * @description 广告列表查询参数
 */

import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator'
import { PaginationQueryDto } from '@internal/base-backend'

export class QueryAdDto extends PaginationQueryDto {
  @ApiProperty({ description: '广告位 ID', required: false })
  @IsOptional()
  @IsString()
  placementId?: string

  @ApiProperty({ description: '广告标题（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  title?: string

  @ApiProperty({ description: '跳转类型', enum: ['miniapp', 'internal', 'external'], required: false })
  @IsOptional()
  @IsString()
  linkType?: string

  @ApiProperty({ description: '状态', enum: [0, 1], required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number
}

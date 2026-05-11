/**
 * @fileoverview 广告位查询参数 DTO
 * @description 广告位列表查询参数
 */

import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator'
import { PaginationQueryDto } from 'moyan-base/backend'

export class QueryAdPlacementDto extends PaginationQueryDto {
  @ApiProperty({ description: '广告位名称（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  name?: string

  @ApiProperty({ description: '广告位编码（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  code?: string

  @ApiProperty({ description: '广告位类型 ID', required: false })
  @IsOptional()
  @IsString()
  placementTypeId?: string

  @ApiProperty({ description: '状态', enum: [0, 1], required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number
}

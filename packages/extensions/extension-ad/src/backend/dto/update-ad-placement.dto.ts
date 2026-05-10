/**
 * @fileoverview 更新广告位请求 DTO
 * @description 更新广告位的请求参数
 */

import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsUUID, IsInt, Min, MaxLength } from 'class-validator'

export class UpdateAdPlacementDto {
  @ApiProperty({ description: '广告位名称', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string

  @ApiProperty({ description: '广告位编码', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  code?: string

  @ApiProperty({ description: '广告位类型 ID', required: false })
  @IsOptional()
  @IsUUID()
  placementTypeId?: string

  @ApiProperty({ description: '广告位描述', required: false })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ description: '状态: 1=启用 0=禁用', required: false })
  @IsOptional()
  @IsInt()
  status?: number

  @ApiProperty({ description: '排序号', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number
}

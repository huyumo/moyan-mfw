/**
 * @fileoverview 更新广告类型配置请求 DTO
 * @description 更新广告位类型配置的请求参数
 */

import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsInt, Min, MaxLength } from 'class-validator'

export class UpdateAdPlacementTypeDto {
  @ApiProperty({ description: '类型名称', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(64, { message: '类型名称长度不能超过 64 个字符' })
  name?: string

  @ApiProperty({ description: '类型编码', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(64, { message: '类型编码长度不能超过 64 个字符' })
  code?: string

  @ApiProperty({ description: '宽度(px)', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number

  @ApiProperty({ description: '高度(px)', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number

  @ApiProperty({ description: '描述', required: false })
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

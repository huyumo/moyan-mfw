/**
 * @fileoverview 创建广告位请求 DTO
 * @description 创建广告位的请求参数
 */

import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, IsOptional, IsInt, Min, MaxLength } from 'class-validator'

export class CreateAdPlacementDto {
  @ApiProperty({ description: '广告位名称', example: '首页顶部横幅' })
  @IsNotEmpty({ message: '广告位名称不能为空' })
  @IsString()
  @MaxLength(64, { message: '广告位名称长度不能超过 64 个字符' })
  name: string

  @ApiProperty({ description: '广告位编码', example: 'home-top-banner' })
  @IsNotEmpty({ message: '广告位编码不能为空' })
  @IsString()
  @MaxLength(64, { message: '广告位编码长度不能超过 64 个字符' })
  code: string

  @ApiProperty({ description: '宽度(px)', example: 750 })
  @IsNotEmpty({ message: '宽度不能为空' })
  @IsInt()
  @Min(1, { message: '宽度最小值为 1' })
  width: number

  @ApiProperty({ description: '高度(px)', example: 300 })
  @IsNotEmpty({ message: '高度不能为空' })
  @IsInt()
  @Min(1, { message: '高度最小值为 1' })
  height: number

  @ApiProperty({ description: '广告位描述', required: false })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ description: '排序号', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number = 0
}

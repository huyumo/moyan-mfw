/**
 * @fileoverview 创建广告类型配置请求 DTO
 * @description 创建广告位类型配置的请求参数
 */

import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, IsOptional, IsInt, Min, MaxLength } from 'class-validator'

export class CreateAdPlacementTypeDto {
  @ApiProperty({ description: '类型名称', example: '首页横幅' })
  @IsNotEmpty({ message: '类型名称不能为空' })
  @IsString()
  @MaxLength(64, { message: '类型名称长度不能超过 64 个字符' })
  name: string

  @ApiProperty({ description: '类型编码', example: 'home-banner' })
  @IsNotEmpty({ message: '类型编码不能为空' })
  @IsString()
  @MaxLength(64, { message: '类型编码长度不能超过 64 个字符' })
  code: string

  @ApiProperty({ description: '宽度(px)', example: 750 })
  @IsNotEmpty({ message: '宽度不能为空' })
  @IsInt()
  @Min(1, { message: '宽度必须大于 0' })
  width: number

  @ApiProperty({ description: '高度(px)', example: 300 })
  @IsNotEmpty({ message: '高度不能为空' })
  @IsInt()
  @Min(1, { message: '高度必须大于 0' })
  height: number

  @ApiProperty({ description: '描述', required: false })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ description: '排序号', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number = 0
}

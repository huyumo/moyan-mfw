/**
 * @fileoverview 更新广告内容请求 DTO
 * @description 更新广告的请求参数
 */

import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsInt, IsDateString, Min, MaxLength } from 'class-validator'

export class UpdateAdDto {
  @ApiProperty({ description: '广告标题', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  title?: string

  @ApiProperty({ description: '广告图片 URL', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string

  @ApiProperty({ description: '跳转类型: miniapp | internal | external', required: false })
  @IsOptional()
  @IsString()
  linkType?: string

  @ApiProperty({ description: '跳转链接', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkUrl?: string

  @ApiProperty({ description: '小程序 AppId', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  miniAppId?: string

  @ApiProperty({ description: '小程序路径', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  miniAppPath?: string

  @ApiProperty({ description: 'App 内部路由路径', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  internalRoute?: string

  @ApiProperty({ description: '投放开始时间', required: false })
  @IsOptional()
  @IsDateString()
  startTime?: string

  @ApiProperty({ description: '投放结束时间', required: false })
  @IsOptional()
  @IsDateString()
  endTime?: string

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

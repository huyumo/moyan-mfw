/**
 * @fileoverview 更新广告内容请求 DTO
 * @description 更新广告的请求参数
 */

import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsInt, IsDateString, IsIn, Min, MaxLength, IsEnum, ValidateNested, ValidateIf } from 'class-validator'
import { Type } from 'class-transformer'
import { ImageResourceDto, MediaResourceDto } from 'moyan-mfw-base/backend'

export class UpdateAdDto {
  @ApiProperty({ description: '广告标题', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  title?: string

  @ApiProperty({ description: '媒体类型', enum: ['image', 'video'], required: false })
  @IsOptional()
  @IsEnum(['image', 'video'])
  mediaType?: 'image' | 'video'

  @ApiProperty({ description: '媒体资源（图片或视频）', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  media?: ImageResourceDto | MediaResourceDto

  @ApiProperty({ description: '跳转类型', enum: ['miniapp', 'internal', 'external'], required: false })
  @IsOptional()
  @IsString()
  @IsIn(['miniapp', 'internal', 'external'], { message: '跳转类型只能是 miniapp / internal / external' })
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

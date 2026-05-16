/**
 * @fileoverview 创建广告内容请求 DTO
 * @description 创建广告的请求参数
 */

import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, IsOptional, IsUUID, IsInt, IsDateString, IsIn, Min, MaxLength, IsEnum, ValidateNested, ValidateIf } from 'class-validator'
import { Type } from 'class-transformer'
import { ImageResourceDto, MediaResourceDto } from 'moyan-mfw-base/backend'

export class CreateAdDto {
  @ApiProperty({ description: '广告位 ID' })
  @IsNotEmpty({ message: '广告位不能为空' })
  @IsUUID()
  placementId: string

  @ApiProperty({ description: '广告标题', example: '双十一大促' })
  @IsNotEmpty({ message: '广告标题不能为空' })
  @IsString()
  @MaxLength(128, { message: '标题长度不能超过 128 个字符' })
  title: string

  @ApiProperty({ description: '媒体类型', enum: ['image', 'video'], default: 'image' })
  @IsEnum(['image', 'video'])
  mediaType: 'image' | 'video'

  @ApiProperty({ description: '媒体资源（图片或视频）' })
  @IsNotEmpty({ message: '媒体资源不能为空' })
  @ValidateNested()
  @Type(() => Object)
  media: ImageResourceDto | MediaResourceDto

  @ApiProperty({ description: '跳转类型', enum: ['none', 'miniapp', 'internal', 'external'], example: 'none' })
  @IsNotEmpty({ message: '跳转类型不能为空' })
  @IsString()
  @IsIn(['none', 'miniapp', 'internal', 'external'], { message: '跳转类型只能是 none / miniapp / internal / external' })
  linkType: string

  @ApiProperty({ description: '跳转链接', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkUrl?: string

  @ApiProperty({ description: '小程序 AppId（linkType=miniapp 时）', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  miniAppId?: string

  @ApiProperty({ description: '小程序路径（linkType=miniapp 时）', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  miniAppPath?: string

  @ApiProperty({ description: 'App 内部路由路径（linkType=internal 时）', required: false })
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

  @ApiProperty({ description: '排序号', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number = 0
}

/**
 * @fileoverview 创建广告内容请求 DTO
 * @description 创建广告的请求参数
 */

import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, IsOptional, IsUUID, IsInt, IsDateString, IsIn, Min, MaxLength, IsEnum, ValidateNested, ValidateIf, IsNumber } from 'class-validator'
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
  @ValidateNested()
  @Type(() => ImageResourceDto)
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

export class ImageMediaDto {
  @ApiProperty({ description: '图片 URL' })
  @IsNotEmpty({ message: '图片 URL 不能为空' })
  @IsString()
  src: string

  @ApiProperty({ description: '图片宽度' })
  @IsNotEmpty({ message: '图片宽度不能为空' })
  @IsNumber()
  width: number

  @ApiProperty({ description: '图片高度' })
  @IsNotEmpty({ message: '图片高度不能为空' })
  @IsNumber()
  height: number
}

export class VideoMediaDto {
  @ApiProperty({ description: '视频 URL' })
  @IsNotEmpty({ message: '视频 URL 不能为空' })
  @IsString()
  url: string

  @ApiProperty({ description: '文件名' })
  @IsNotEmpty({ message: '文件名不能为空' })
  @IsString()
  name: string

  @ApiProperty({ description: 'MIME 类型' })
  @IsNotEmpty({ message: 'MIME 类型不能为空' })
  @IsString()
  type: string

  @ApiProperty({ description: '文件大小', required: false })
  @IsOptional()
  @IsNumber()
  size?: number

  @ApiProperty({ description: '时长', required: false })
  @IsOptional()
  @IsNumber()
  duration?: number
}

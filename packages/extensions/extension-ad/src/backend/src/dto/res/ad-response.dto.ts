/**
 * @fileoverview 广告内容响应 DTO
 * @description 广告内容列表/详情的响应数据结构
 */

import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { ImageResourceDto, MediaResourceDto } from 'moyan-mfw-base/backend'

/**
 * 关联广告位简要信息
 */
export class AdPlacementBriefDto {
  @ApiProperty({ description: '广告位 ID' })
  @Expose()
  id: string

  @ApiProperty({ description: '广告位名称' })
  @Expose()
  name: string

  @ApiProperty({ description: '广告位编码' })
  @Expose()
  code: string
}

/**
 * 广告内容响应 DTO
 */
export class AdResponseDto {
  @ApiProperty({ description: '广告 ID' })
  @Expose()
  id: string

  @ApiProperty({ description: '所属广告位 ID' })
  @Expose()
  placementId: string

  @ApiProperty({ description: '所属广告位简要信息', type: AdPlacementBriefDto })
  @Expose()
  placement: AdPlacementBriefDto

  @ApiProperty({ description: '广告标题' })
  @Expose()
  title: string

  @ApiProperty({ description: '媒体类型', enum: ['image', 'video'] })
  @Expose()
  mediaType: 'image' | 'video'

  @ApiProperty({ description: '媒体资源（图片或视频）' })
  @Expose()
  media: ImageResourceDto | MediaResourceDto

  @ApiProperty({ description: '跳转链接', required: false })
  @Expose()
  linkUrl?: string

  @ApiProperty({ description: '跳转类型: none | miniapp | internal | external' })
  @Expose()
  linkType: string

  @ApiProperty({ description: '小程序 AppId（linkType=miniapp 时）', required: false })
  @Expose()
  miniAppId?: string

  @ApiProperty({ description: '小程序路径（linkType=miniapp 时）', required: false })
  @Expose()
  miniAppPath?: string

  @ApiProperty({ description: 'App 内部路由路径（linkType=internal 时）', required: false })
  @Expose()
  internalRoute?: string

  @ApiProperty({ description: '投放开始时间', required: false })
  @Expose()
  startTime?: Date

  @ApiProperty({ description: '投放结束时间', required: false })
  @Expose()
  endTime?: Date

  @ApiProperty({ description: '状态: 1=启用 0=禁用' })
  @Expose()
  status: number

  @ApiProperty({ description: '排序号' })
  @Expose()
  sortOrder: number

  @ApiProperty({ description: '创建时间' })
  @Expose()
  createdAt: Date

  @ApiProperty({ description: '更新时间' })
  @Expose()
  updateAt: Date
}

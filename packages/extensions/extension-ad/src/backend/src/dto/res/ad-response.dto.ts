/**
 * @fileoverview 广告内容响应 DTO
 * @description 广告内容列表/详情的响应数据结构
 */

import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

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

  @ApiProperty({ description: '广告图片 URL' })
  @Expose()
  imageUrl: string

  @ApiProperty({ description: '跳转链接' })
  @Expose()
  linkUrl: string

  @ApiProperty({ description: '跳转类型: miniapp | internal | external' })
  @Expose()
  linkType: string

  @ApiProperty({ description: '小程序 AppId（linkType=miniapp 时）' })
  @Expose()
  miniAppId: string

  @ApiProperty({ description: '小程序路径（linkType=miniapp 时）' })
  @Expose()
  miniAppPath: string

  @ApiProperty({ description: 'App 内部路由路径（linkType=internal 时）' })
  @Expose()
  internalRoute: string

  @ApiProperty({ description: '投放开始时间' })
  @Expose()
  startTime: Date

  @ApiProperty({ description: '投放结束时间' })
  @Expose()
  endTime: Date

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

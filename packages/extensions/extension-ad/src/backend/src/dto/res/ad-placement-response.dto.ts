/**
 * @fileoverview 广告位响应 DTO
 * @description 广告位列表/详情的响应数据结构
 */

import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

/**
 * 广告位响应 DTO
 */
export class AdPlacementResponseDto {
  @ApiProperty({ description: '广告位 ID' })
  @Expose()
  id: string

  @ApiProperty({ description: '广告位名称' })
  @Expose()
  name: string

  @ApiProperty({ description: '广告位编码 - 唯一标识' })
  @Expose()
  code: string

  @ApiProperty({ description: '宽度(px)' })
  @Expose()
  width: number

  @ApiProperty({ description: '高度(px)' })
  @Expose()
  height: number

  @ApiProperty({ description: '广告位描述' })
  @Expose()
  description: string

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

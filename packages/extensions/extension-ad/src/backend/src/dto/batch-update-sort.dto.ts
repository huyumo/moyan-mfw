/**
 * @fileoverview 批量更新排序 DTO
 * @description 用于广告拖拽排序后批量更新 sortOrder
 */

import { ApiProperty } from '@nestjs/swagger'
import { IsArray, ValidateNested, IsUUID, IsInt, Min } from 'class-validator'
import { Type } from 'class-transformer'

class SortItem {
  @ApiProperty({ description: '广告 ID' })
  @IsUUID()
  id: string

  @ApiProperty({ description: '排序号', example: 0 })
  @IsInt()
  @Min(0)
  sortOrder: number
}

export class BatchUpdateSortDto {
  @ApiProperty({ description: '排序项列表', type: [SortItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortItem)
  items: SortItem[]
}
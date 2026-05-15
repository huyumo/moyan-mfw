/**
 * @fileoverview 应用类型查询参数 DTO
 * @description 应用类型列表查询参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { PaginationQueryDto } from '../../../../../../common';

/**
 * 应用类型查询参数 DTO
 * @description 继承自 PaginationQueryDto，自动获得分页参数
 */
export class QueryAppTypeDto extends PaginationQueryDto {
  /**
   * 类型名称（模糊查询）
   */
  @ApiProperty({ description: '类型名称（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  typeName?: string;

  /**
   * 类型编码（模糊查询）
   */
  @ApiProperty({ description: '类型编码（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  typeCode?: string;

  /**
   * 类型状态
   */
  @ApiProperty({ description: '类型状态', enum: [0, 1], required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  typeStatus?: number;

  /**
   * 排序字段
   * @default 'sortOrder'
   */
  @ApiProperty({ description: '排序字段', default: 'sortOrder', required: false })
  @IsOptional()
  @IsString()
  sortField?: string = 'sortOrder';
}

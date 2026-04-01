/**
 * @fileoverview 应用查询参数 DTO
 * @description 应用列表查询参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { PaginationQueryDto } from '../../../../../common';

/**
 * 应用查询参数 DTO
 * @description 继承自 PaginationQueryDto，自动获得分页参数
 */
export class QueryAppDto extends PaginationQueryDto {
  /**
   * 应用名称（模糊查询）
   */
  @ApiProperty({ description: '应用名称（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  appName?: string;

  /**
   * 应用编码（模糊查询）
   */
  @ApiProperty({ description: '应用编码（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  appCode?: string;

  /**
   * 应用类型 ID
   */
  @ApiProperty({ description: '应用类型 ID', required: false })
  @IsOptional()
  @IsString()
  appTypeId?: string;

  /**
   * 拥有者 ID
   */
  @ApiProperty({ description: '拥有者 ID', required: false })
  @IsOptional()
  @IsString()
  ownerId?: string;

  /**
   * 应用状态
   */
  @ApiProperty({ description: '应用状态', enum: [0, 1], required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  appStatus?: number;
}

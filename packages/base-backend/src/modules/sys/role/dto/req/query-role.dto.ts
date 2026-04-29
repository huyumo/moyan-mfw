/**
 * @fileoverview 角色查询参数 DTO
 * @description 角色列表查询参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { PaginationQueryDto } from '../../../../../common';

/**
 * 角色查询参数 DTO
 * @description 继承自 PaginationQueryDto，自动获得分页参数
 */
export class QueryRoleDto extends PaginationQueryDto {
  /**
   * 角色编码（模糊查询）
   */
  @ApiProperty({ description: '角色编码（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  roleCode?: string;

  /**
   * 角色名称（模糊查询）
   */
  @ApiProperty({ description: '角色名称（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  roleName?: string;

  /**
   * 角色状态
   */
  @ApiProperty({ description: '角色状态', enum: [0, 1], required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  roleStatus?: number;

  /**
   * 应用类型 ID
   */
  @ApiProperty({ description: '应用类型 ID', required: false })
  @IsOptional()
  @IsString()
  appTypeId?: string;

  /**
   * 应用 ID
   */
  @ApiProperty({ description: '应用 ID', required: false })
  @IsOptional()
  @IsString()
  appId?: string;

  /**
   * 排序字段
   * @default 'sortOrder'
   */
  @ApiProperty({ description: '排序字段', default: 'sortOrder', required: false })
  @IsOptional()
  @IsString()
  sortField?: string = 'sortOrder';

  /**
   * 是否内置角色
   */
  @ApiProperty({ description: '是否内置角色', enum: [0, 1], required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  isBuiltin?: boolean;
}

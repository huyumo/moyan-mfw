/**
 * @fileoverview 权限查询参数 DTO
 * @description 权限列表查询参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PermissionType, NodeType } from '../../../entities/permission.entity';
import { PaginationQueryDto } from '../../../../../../common';

/**
 * 权限查询参数 DTO
 * @description 继承自 PaginationQueryDto，自动获得分页参数
 */
export class QueryPermissionDto extends PaginationQueryDto {
  /**
   * 应用类型 ID
   */
  @ApiProperty({ description: '应用类型 ID', required: false })
  @IsOptional()
  @IsString()
  appTypeId?: string;

  /**
   * 权限名称（模糊查询）
   */
  @ApiProperty({ description: '权限名称（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  permName?: string;

  /**
   * 权限编码（模糊查询）
   */
  @ApiProperty({ description: '权限编码（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  permCode?: string;

  /**
   * 权限类型
   */
  @ApiProperty({ description: '权限类型', enum: PermissionType, required: false })
  @IsOptional()
  @IsEnum(PermissionType)
  permissionType?: PermissionType;

  /**
   * 节点类型
   */
  @ApiProperty({ description: '节点类型', enum: NodeType, required: false })
  @IsOptional()
  @IsEnum(NodeType)
  nodeType?: NodeType;

  /**
   * 父权限 ID
   */
  @ApiProperty({ description: '父权限 ID', required: false })
  @IsOptional()
  @IsString()
  parentId?: string;

  /**
   * 排序字段
   * @default 'sortOrder'
   */
  @ApiProperty({ description: '排序字段', default: 'sortOrder', required: false })
  @IsOptional()
  @IsString()
  sortField?: string = 'sortOrder';
}

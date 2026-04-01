/**
 * @fileoverview 权限查询参数 DTO
 * @description 权限列表查询参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PermissionType, NodeType } from '../../entities/permission.entity';

/**
 * 权限查询参数 DTO
 */
export class QueryPermissionDto {
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
   * 当前页码
   */
  @ApiProperty({ description: '当前页码', default: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * 每页数量
   */
  @ApiProperty({ description: '每页数量', default: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;
}

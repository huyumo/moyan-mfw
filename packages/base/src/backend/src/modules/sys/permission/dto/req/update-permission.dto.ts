/**
 * @fileoverview 更新权限请求 DTO
 * @description 更新权限的请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { NodeType, ShowMode, PermissionType } from '../../../entities/permission.entity';

/**
 * 更新权限请求 DTO
 */
export class UpdatePermissionDto {
  /**
   * 权限名称
   */
  @ApiProperty({ description: '权限名称', required: false })
  @IsOptional()
  @IsString()
  permName?: string;

  /**
   * 权限编码
   */
  @ApiProperty({ description: '权限编码', required: false })
  @IsOptional()
  @IsString()
  permCode?: string;

  /**
   * 权限描述
   */
  @ApiProperty({ description: '权限描述', required: false })
  @IsOptional()
  @IsString()
  permDesc?: string;

  /**
   * 节点类型
   */
  @ApiProperty({ description: '节点类型', enum: NodeType, required: false })
  @IsOptional()
  @IsEnum(NodeType)
  nodeType?: NodeType;

  /**
   * 路由路径
   */
  @ApiProperty({ description: '路由路径', required: false })
  @IsOptional()
  @IsString()
  routePath?: string;

  /**
   * 外部链接
   */
  @ApiProperty({ description: '外部链接', required: false })
  @IsOptional()
  @IsString()
  externalUrl?: string;

  /**
   * 图标名称
   */
  @ApiProperty({ description: '图标名称', required: false })
  @IsOptional()
  @IsString()
  iconName?: string;

  /**
   * 排序号
   */
  @ApiProperty({ description: '排序号', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  /**
   * 是否可见
   */
  @ApiProperty({ description: '是否可见', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  isVisible?: number;

  /**
   * 是否缓存
   */
  @ApiProperty({ description: '是否缓存', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  isCache?: number;

  /**
   * 显示模式
   */
  @ApiProperty({ description: '显示模式', enum: ShowMode, required: false })
  @IsOptional()
  @IsEnum(ShowMode)
  showMode?: ShowMode;

  /**
   * 权限状态
   */
  @ApiProperty({ description: '权限状态', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  permStatus?: number;

  /**
   * 权限值（位运算）
   */
  @ApiProperty({ description: '权限值（位运算）', required: false })
  @IsOptional()
  permissionValue?: bigint;
}

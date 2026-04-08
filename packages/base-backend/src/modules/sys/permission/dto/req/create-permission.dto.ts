/**
 * @fileoverview 创建权限请求 DTO
 * @description 创建权限的请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { NodeType, ShowMode, PermissionType } from '../../entities/permission.entity';

/**
 * 创建权限请求 DTO
 */
export class CreatePermissionDto {
  /**
   * 权限名称
   */
  @ApiProperty({ description: '权限名称', example: '用户列表' })
  @IsNotEmpty({ message: '权限名称不能为空' })
  @IsString()
  permName: string;

  /**
   * 权限编码
   */
  @ApiProperty({ description: '权限编码', example: 'system:user-list' })
  @IsNotEmpty({ message: '权限编码不能为空' })
  @IsString()
  permCode: string;

  /**
   * 权限描述
   */
  @ApiProperty({ description: '权限描述', required: false })
  @IsOptional()
  @IsString()
  permDesc?: string;

  /**
   * 权限类型
   */
  @ApiProperty({ description: '权限类型', enum: PermissionType, default: PermissionType.NORMAL })
  @IsNotEmpty({ message: '权限类型不能为空' })
  @IsEnum(PermissionType)
  permissionType: PermissionType;

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
  @ApiProperty({ description: '排序号', default: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number = 0;

  /**
   * 是否可见
   */
  @ApiProperty({ description: '是否可见', default: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  isVisible?: number = 1;

  /**
   * 是否缓存
   */
  @ApiProperty({ description: '是否缓存', default: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  isCache?: number = 1;

  /**
   * 显示模式
   */
  @ApiProperty({ description: '显示模式', enum: ShowMode, default: ShowMode.NORMAL })
  @IsOptional()
  @IsEnum(ShowMode)
  showMode?: ShowMode = ShowMode.NORMAL;

  /**
   * 权限状态
   */
  @ApiProperty({ description: '权限状态', default: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  permStatus?: number = 1;

  /**
   * 权限值（位运算）
   */
  @ApiProperty({ description: '权限值（位运算）', default: 0, required: false })
  @IsOptional()
  permissionValue?: bigint = 0n;
}

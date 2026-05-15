/**
 * @fileoverview 权限响应 DTO
 * @description 权限信息的响应数据结构
 */

import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type, Transform } from 'class-transformer';
import { PermissionType, NodeType, ShowMode } from '../../../entities/permission.entity';

/**
 * 权限树节点 DTO
 * 用于返回树形结构的权限数据
 */
export class PermissionTreeNodeDto {
  /**
   * 权限 ID
   */
  @ApiProperty({ description: '权限 ID' })
  @Expose()
  id: string;

  /**
   * 权限名称
   */
  @ApiProperty({ description: '权限名称' })
  @Expose()
  permName: string;

  /**
   * 权限编码
   */
  @ApiProperty({ description: '权限编码' })
  @Expose()
  permCode: string;

  /**
   * 权限描述
   */
  @ApiProperty({ description: '权限描述', required: false })
  @Expose()
  permDesc?: string;

  /**
   * 权限类型
   */
  @ApiProperty({ description: '权限类型', enum: PermissionType })
  @Expose()
  permissionType: PermissionType;

  /**
   * 节点类型
   */
  @ApiProperty({ description: '节点类型', enum: NodeType })
  @Expose()
  nodeType: NodeType;

  /**
   * 父权限 ID
   */
  @ApiProperty({ description: '父权限 ID', required: false })
  @Expose()
  parentId?: string;

  /**
   * 路由路径
   */
  @ApiProperty({ description: '路由路径', required: false })
  @Expose()
  routePath?: string;

  /**
   * 外部链接
   */
  @ApiProperty({ description: '外部链接', required: false })
  @Expose()
  externalUrl?: string;

  /**
   * 图标名称
   */
  @ApiProperty({ description: '图标名称', required: false })
  @Expose()
  iconName?: string;

  /**
   * 排序号
   */
  @ApiProperty({ description: '排序号' })
  @Expose()
  sortOrder: number;

  /**
   * 是否可见
   */
  @ApiProperty({ description: '是否可见' })
  @Expose()
  isVisible: number;

  /**
   * 是否缓存
   */
  @ApiProperty({ description: '是否缓存' })
  @Expose()
  isCache: number;

  /**
   * 显示模式
   */
  @ApiProperty({ description: '显示模式', enum: ShowMode })
  @Expose()
  showMode: ShowMode;

  /**
   * 权限状态
   */
  @ApiProperty({ description: '权限状态' })
  @Expose()
  permStatus: number;

  /**
   * 是否选中
   */
  @ApiProperty({ description: '是否选中' })
  @Expose()
  checked: boolean;

  /**
   * 是否自动同步
   */
  @ApiProperty({ description: '是否自动同步：1=同步生成 0=手动添加', required: false })
  @Expose()
  isAutoSync?: number;

  /**
   * 权限值（位运算）
   */
  @ApiProperty({ description: '权限值（位运算）', example: '7', required: false })
  @Expose()
  @Transform(({ value }) => value?.toString())
  permissionValue?: string;

  /**
   * 父权限值（位运算）
   */
  @ApiProperty({ description: '父权限值（位运算）', example: '7', required: false })
  @Expose()
  @Transform(({ value }) => value?.toString())
  parentPermissionValue?: string;

  /**
   * 子权限列表
   */
  @ApiProperty({ description: '子权限列表', type: () => [PermissionTreeNodeDto], required: false })
  @Expose()
  @Type(() => PermissionTreeNodeDto)
  children?: PermissionTreeNodeDto[];

  /**
   * 创建时间
   */
  @ApiProperty({ description: '创建时间' })
  @Expose()
  createdAt?: Date;

  /**
   * 更新时间
   */
  @ApiProperty({ description: '更新时间' })
  @Expose()
  updateAt?: Date;
}

/**
 * 权限响应 DTO
 */
export class PermissionResponseDto {
  /**
   * 权限 ID
   */
  @ApiProperty({ description: '权限 ID' })
  @Expose()
  id: string;

  /**
   * 权限名称
   */
  @ApiProperty({ description: '权限名称' })
  @Expose()
  permName: string;

  /**
   * 权限编码
   */
  @ApiProperty({ description: '权限编码' })
  @Expose()
  permCode: string;

  /**
   * 权限描述
   */
  @ApiProperty({ description: '权限描述' })
  @Expose()
  permDesc: string;

  /**
   * 权限类型
   */
  @ApiProperty({ description: '权限类型', enum: PermissionType })
  @Expose()
  permissionType: PermissionType;

  /**
   * 节点类型
   */
  @ApiProperty({ description: '节点类型', enum: NodeType })
  @Expose()
  nodeType: NodeType;

  /**
   * 父权限 ID
   */
  @ApiProperty({ description: '父权限 ID' })
  @Expose()
  parentId: string;

  /**
   * 路由路径
   */
  @ApiProperty({ description: '路由路径' })
  @Expose()
  routePath: string;

  /**
   * 外部链接
   */
  @ApiProperty({ description: '外部链接' })
  @Expose()
  externalUrl: string;

  /**
   * 图标名称
   */
  @ApiProperty({ description: '图标名称' })
  @Expose()
  iconName: string;

  /**
   * 排序号
   */
  @ApiProperty({ description: '排序号' })
  @Expose()
  sortOrder: number;

  /**
   * 是否可见
   */
  @ApiProperty({ description: '是否可见' })
  @Expose()
  isVisible: number;

  /**
   * 是否缓存
   */
  @ApiProperty({ description: '是否缓存' })
  @Expose()
  isCache: number;

  /**
   * 显示模式
   */
  @ApiProperty({ description: '显示模式', enum: ShowMode })
  @Expose()
  showMode: ShowMode;

  /**
   * 权限状态
   */
  @ApiProperty({ description: '权限状态' })
  @Expose()
  permStatus: number;

  /**
   * 权限值（位运算）
   */
  @ApiProperty({ description: '权限值（位运算）', example: '7' })
  @Expose()
  @Transform(({ value }) => value?.toString())
  permissionValue: string;

  /**
   * 创建时间
   */
  @ApiProperty({ description: '创建时间' })
  @Expose()
  createdAt: Date;

  /**
   * 更新时间
   */
  @ApiProperty({ description: '更新时间' })
  @Expose()
  updateAt: Date;
}

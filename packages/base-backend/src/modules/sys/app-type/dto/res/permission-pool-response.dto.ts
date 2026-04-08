/**
 * @fileoverview 权限池响应 DTO
 * @description 权限池配置的响应数据结构
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * 权限树节点响应 DTO
 * @description 权限树节点的详细信息
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
  @ApiPropertyOptional({ description: '权限描述' })
  @Expose()
  permDesc?: string;

  /**
   * 权限类型
   * @description PC-平台权限 / NORMAL-普通权限
   */
  @ApiProperty({ description: '权限类型', enum: ['PC', 'NORMAL'] })
  @Expose()
  permissionType: 'PC' | 'NORMAL';

  /**
   * 节点类型
   * @description MENU-菜单 / PAGE-页面 / TAG-标签
   */
  @ApiProperty({ description: '节点类型', enum: ['MENU', 'PAGE', 'TAG'] })
  @Expose()
  nodeType: 'MENU' | 'PAGE' | 'TAG';

  /**
   * 父权限 ID
   */
  @ApiPropertyOptional({ description: '父权限 ID' })
  @Expose()
  parentId?: string;

  /**
   * 路由路径
   */
  @ApiPropertyOptional({ description: '路由路径' })
  @Expose()
  routePath?: string;

  /**
   * 外部链接
   */
  @ApiPropertyOptional({ description: '外部链接 URL' })
  @Expose()
  externalUrl?: string;

  /**
   * 图标名称
   */
  @ApiPropertyOptional({ description: '图标名称' })
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
   * @description NORMAL-正常显示 / DEV-开发者模式显示
   */
  @ApiProperty({ description: '显示模式', enum: ['NORMAL', 'DEV'] })
  @Expose()
  showMode: 'NORMAL' | 'DEV';

  /**
   * 权限状态
   */
  @ApiProperty({ description: '权限状态（1:启用 0:禁用）' })
  @Expose()
  permStatus: number;

  /**
   * 是否自动同步
   */
  @ApiPropertyOptional({ description: '是否自动同步' })
  @Expose()
  isAutoSync?: number;

  /**
   * 是否在权限池中
   */
  @ApiProperty({ description: '是否在权限池中' })
  @Expose()
  inPool: boolean;

  /**
   * 权限值
   * @description 位运算权限值，十进制字符串格式
   */
  @ApiPropertyOptional({ description: '权限值（位运算权限值，十进制字符串格式）' })
  @Expose()
  permissionValue?: string;

  /**
   * 子节点列表
   */
  @ApiPropertyOptional({ description: '子节点列表', type: [PermissionTreeNodeDto] })
  @Expose()
  @Type(() => PermissionTreeNodeDto)
  children?: PermissionTreeNodeDto[];
}

/**
 * 权限树响应 DTO
 * @description 包含 PC 权限树和普通权限树
 */
export class PermissionTreesResponseDto {
  /**
   * PC 权限树
   */
  @ApiProperty({ description: 'PC 权限树', type: [PermissionTreeNodeDto] })
  @Expose()
  @Type(() => PermissionTreeNodeDto)
  pcTree: PermissionTreeNodeDto[];

  /**
   * 普通权限树
   */
  @ApiProperty({ description: '普通权限树', type: [PermissionTreeNodeDto] })
  @Expose()
  @Type(() => PermissionTreeNodeDto)
  normalTree: PermissionTreeNodeDto[];
}

/**
 * 权限池响应 DTO
 * @description 获取权限池配置的响应数据
 */
export class PermissionPoolResponseDto {
  /**
   * 应用类型 ID
   */
  @ApiProperty({ description: '应用类型 ID' })
  @Expose()
  appTypeId: string;

  /**
   * 权限树配置
   */
  @ApiProperty({ description: '权限树配置', type: PermissionTreesResponseDto })
  @Expose()
  @Type(() => PermissionTreesResponseDto)
  permissionTrees: PermissionTreesResponseDto;
}

/**
 * 更新权限池响应 DTO
 * @description 更新权限池配置的响应数据
 */
export class UpdatePermissionPoolResponseDto {
  /**
   * 应用类型 ID
   */
  @ApiProperty({ description: '应用类型 ID' })
  @Expose()
  appTypeId: string;

  /**
   * 更新数量
   */
  @ApiProperty({ description: '更新的权限节点数量' })
  @Expose()
  updatedCount: number;
}
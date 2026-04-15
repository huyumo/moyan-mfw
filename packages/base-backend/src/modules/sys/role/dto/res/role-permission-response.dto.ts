/**
 * @fileoverview 角色权限响应 DTO
 * @description 角色权限配置的响应数据结构
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * 角色权限树节点响应 DTO
 * @description 角色权限树节点的详细信息
 */
export class RolePermissionTreeNodeDto {
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
   * 是否选中
   * @description 前端勾选状态，true=已分配给角色
   */
  @ApiProperty({ description: '是否选中（前端勾选状态）' })
  @Expose()
  checked: boolean;

  /**
   * 权限值
   * @description 位运算权限值，十进制字符串格式
   */
  @ApiPropertyOptional({ description: '权限值（位运算权限值，十进制字符串格式）' })
  @Expose()
  permissionValue?: string;

  /**
   * 父权限的权限值
   * @description 权限池场景：Permission 实体定义的 permissionValue；角色权限场景：权限池配置的 permissionValue
   */
  @ApiPropertyOptional({ description: '父权限的权限值（十进制字符串格式）' })
  @Expose()
  parentPermissionValue?: string;

  /**
   * 子节点列表
   */
  @ApiPropertyOptional({ description: '子节点列表', type: [RolePermissionTreeNodeDto] })
  @Expose()
  @Type(() => RolePermissionTreeNodeDto)
  children?: RolePermissionTreeNodeDto[];
}

/**
 * 角色权限树响应 DTO
 * @description 包含 PC 权限树和普通权限树
 */
export class RolePermissionTreesResponseDto {
  /**
   * PC 权限树
   */
  @ApiProperty({ description: 'PC 权限树', type: [RolePermissionTreeNodeDto] })
  @Expose()
  @Type(() => RolePermissionTreeNodeDto)
  pcTree: RolePermissionTreeNodeDto[];

  /**
   * 普通权限树
   */
  @ApiProperty({ description: '普通权限树', type: [RolePermissionTreeNodeDto] })
  @Expose()
  @Type(() => RolePermissionTreeNodeDto)
  normalTree: RolePermissionTreeNodeDto[];
}

/**
 * 角色权限响应 DTO
 * @description 获取角色权限配置的响应数据
 */
export class RolePermissionResponseDto {
  /**
   * 角色 ID
   */
  @ApiProperty({ description: '角色 ID' })
  @Expose()
  roleId: string;

  /**
   * 权限树配置
   */
  @ApiProperty({ description: '权限树配置', type: RolePermissionTreesResponseDto })
  @Expose()
  @Type(() => RolePermissionTreesResponseDto)
  permissionTrees: RolePermissionTreesResponseDto;
}
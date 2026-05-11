/**
 * @fileoverview 角色响应 DTO
 * @description 角色信息的响应数据结构
 */

import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * 角色响应 DTO
 */
export class RoleResponseDto {
  /**
   * 角色 ID
   */
  @ApiProperty({ description: '角色 ID' })
  @Expose()
  id: string;

  /**
   * 角色名称
   */
  @ApiProperty({ description: '角色名称' })
  @Expose()
  roleName: string;

  /**
   * 角色编码
   */
  @ApiProperty({ description: '角色编码' })
  @Expose()
  roleCode: string;

  /**
   * 角色描述
   */
  @ApiProperty({ description: '角色描述' })
  @Expose()
  roleDesc: string;

  /**
   * 应用类型 ID
   */
  @ApiProperty({ description: '应用类型 ID' })
  @Expose()
  appTypeId: string;

  /**
   * 应用实例 ID
   */
  @ApiProperty({ description: '应用实例 ID' })
  @Expose()
  appId: string;

  /**
   * 是否内置
   */
  @ApiProperty({ description: '是否内置' })
  @Expose()
  isBuiltin: number;

  /**
   * 是否拥有者角色
   */
  @ApiProperty({ description: '是否拥有者角色' })
  @Expose()
  isOwner: number;

  /**
   * 角色状态
   */
  @ApiProperty({ description: '角色状态 (1:启用 0:禁用)' })
  @Expose()
  roleStatus: number;

  /**
   * 排序号
   */
  @ApiProperty({ description: '排序号' })
  @Expose()
  sortOrder: number;

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

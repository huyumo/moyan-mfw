/**
 * @fileoverview 角色权限响应 DTO
 * @description 角色权限配置的响应数据结构
 */

import { PermissionTreesResponseDto } from '@/modules/sys/app-type';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * 角色权限树响应 DTO
 * @description 包含 PC 权限树和普通权限树
 */
export class RolePermissionTreesResponseDto  extends PermissionTreesResponseDto {
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
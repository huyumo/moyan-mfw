/**
 * @fileoverview 成员响应 DTO
 * @description 应用成员信息的响应数据结构
 */

import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * 角色信息响应 DTO
 */
export class RoleInfoDto {
  /**
   * 角色 ID
   */
  @ApiProperty({ description: '角色 ID' })
  @Expose()
  roleId: string;

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
   * 是否内置角色
   */
  @ApiProperty({ description: '是否内置角色' })
  @Expose()
  isBuiltin: number;
}

/**
 * 用户信息响应 DTO
 */
export class UserInfoDto {
  /**
   * 用户 ID
   */
  @ApiProperty({ description: '用户 ID' })
  @Expose()
  id: string;

  /**
   * 用户名
   */
  @ApiProperty({ description: '用户名' })
  @Expose()
  username: string;

  /**
   * 昵称
   */
  @ApiProperty({ description: '昵称' })
  @Expose()
  nickname: string;

  /**
   * 手机号
   */
  @ApiProperty({ description: '手机号' })
  @Expose()
  phone: string;

  /**
   * 头像
   */
  @ApiProperty({ description: '头像' })
  @Expose()
  avatar: string;
}

/**
 * 成员响应 DTO
 */
export class MemberResponseDto {
  /**
   * 成员 ID（应用 - 成员关联 ID）
   */
  @ApiProperty({ description: '成员 ID' })
  @Expose()
  id: string;

  /**
   * 应用 ID
   */
  @ApiProperty({ description: '应用 ID' })
  @Expose()
  appId: string;

  /**
   * 用户 ID
   */
  @ApiProperty({ description: '用户 ID' })
  @Expose()
  userId: string;

  /**
   * 创建时间
   */
  @ApiProperty({ description: '创建时间' })
  @Expose()
  createdAt: Date;

  /**
   * 用户信息
   */
  @ApiProperty({ description: '用户信息', type: UserInfoDto })
  @Expose()
  user: UserInfoDto;

  /**
   * 角色列表
   */
  @ApiProperty({ description: '角色列表', type: [RoleInfoDto] })
  @Expose()
  roles: RoleInfoDto[];
}

/**
 * 可选角色响应 DTO
 */
export class AvailableRoleDto {
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
   * 是否内置角色
   */
  @ApiProperty({ description: '是否内置角色' })
  @Expose()
  isBuiltin: number;

  /**
   * 是否拥有者角色
   */
  @ApiProperty({ description: '是否拥有者角色' })
  @Expose()
  isOwner: number;
}

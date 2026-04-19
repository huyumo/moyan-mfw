/**
 * @fileoverview 成员响应 DTO
 * @description 应用成员信息的响应数据结构
 */

import { UserInfoDto } from '@/modules/sys/auth';
import { RoleResponseDto } from '@/modules/sys/role';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';


export class MemberUserInfoDto extends PickType(
  UserInfoDto, [
  'id',
  'username',
  'nickname',
  'avatar']) {
}

export class MemberRoleInfoDto extends PickType(
  RoleResponseDto, [
  'roleName',
  'roleCode',
  'isBuiltin']) {
  @ApiProperty({ description: '角色 ID' })
  @Expose()
  roleId: string;
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
   * 用户昵称
   */
  @ApiProperty({ description: '用户昵称' })
  @Expose()
  nickname: string;

  /**
   * 用户头像
   */
  @ApiProperty({ description: '用户头像' })
  @Expose()
  avatar: string;

  /**
   * 用户邮箱
   */
  @ApiProperty({ description: '用户邮箱' })
  @Expose()
  email: string;

  /**
   * 用户手机号
   */
  @ApiProperty({ description: '用户手机号' })
  @Expose()
  phone: string;

  /**
   * 用户名
   */
  @ApiProperty({ description: '用户名' })
  @Expose()
  username: string;

  /**
   * 应用编码
   */
  @ApiProperty({ description: '应用编码' })
  @Expose()
  appCode: string;

  /**
   * 应用名称
   */
  @ApiProperty({ description: '应用名称' })
  @Expose()
  appName: string;

  /**
   * 应用图标
   */
  @ApiProperty({ description: '应用图标' })
  @Expose()
  appIcon: string;

  /**
   * 拥有者 ID
   */
  @ApiProperty({ description: '拥有者 ID' })
  @Expose()
  ownerId: string;

  /**
   * 排序序号
   */
  @ApiProperty({ description: '排序序号' })
  @Expose()
  sortOrder: number;

  /**
   * 应用类型 ID
   */
  @ApiProperty({ description: '应用类型 ID' })
  @Expose()
  appTypeId: string;

  /**
   * 角色列表
   */
  @ApiProperty({ description: '角色列表', type: MemberRoleInfoDto, isArray: true })
  @Expose()
  roles?: MemberRoleInfoDto[];
}

/**
 * 可选角色响应 DTO
 */
export class AvailableAvailableRoleDto {
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
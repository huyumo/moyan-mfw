/**
 * @fileoverview 认证响应 DTO
 * @description 登录响应数据结构
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户信息 DTO（登录响应中嵌套使用）
 */
export class UserSummaryDto {
  /**
   * 用户名
   */
  @ApiProperty({ description: '用户名' })
  username: string;

  /**
   * 昵称
   */
  @ApiProperty({ description: '昵称' })
  nickname: string;

  /**
   * 头像
   */
  @ApiProperty({ description: '头像 URL' })
  avatar: string;
}

/**
 * 登录响应 DTO
 */
export class LoginResponseDto {
  /**
   * 访问 Token
   */
  @ApiProperty({ description: '访问 Token' })
  accessToken: string;

  /**
   * 刷新 Token
   */
  @ApiProperty({ description: '刷新 Token' })
  refreshToken: string;

  /**
   * Token 类型
   */
  @ApiProperty({ description: 'Token 类型', example: 'Bearer' })
  tokenType: string;

  /**
   * 过期时间（秒）
   */
  @ApiProperty({ description: '过期时间（秒）', example: 86400 })
  expiresIn: number;

  /**
   * 用户信息
   */
  @ApiProperty({ description: '用户信息', type: UserSummaryDto })
  user?: UserSummaryDto;
}

/**
 * 用户信息响应 DTO
 */
export class UserInfoDto {
  /**
   * 用户 ID
   */
  @ApiProperty({ description: '用户 ID' })
  id: string;

  /**
   * 用户名
   */
  @ApiProperty({ description: '用户名' })
  username: string;

  /**
   * 昵称
   */
  @ApiProperty({ description: '昵称' })
  nickname: string;

  /**
   * 头像
   */
  @ApiProperty({ description: '头像 URL' })
  avatar: string;

  /**
   * 角色列表
   */
  @ApiProperty({ description: '角色列表', type: [String] })
  roles: string[];
}

/**
 * 应用实例项 DTO
 * @description 用户可访问的应用实例信息
 */
export class AppInstanceItemDto {
  /**
   * 应用实例 ID
   */
  @ApiProperty({ description: '应用实例 ID' })
  appId: string;

  /**
   * 应用实例名称
   */
  @ApiProperty({ description: '应用实例名称' })
  appName: string;

  /**
   * 应用实例编码
   */
  @ApiProperty({ description: '应用实例编码' })
  appCode: string;

  /**
   * 应用类型 ID
   */
  @ApiProperty({ description: '应用类型 ID' })
  appTypeId: string;

  /**
   * 应用类型编码
   */
  @ApiProperty({ description: '应用类型编码' })
  appTypeCode: string;

  /**
   * 应用类型名称
   */
  @ApiProperty({ description: '应用类型名称' })
  appTypeName: string;

  /**
   * 用户身份
   */
  @ApiProperty({ description: '用户身份', enum: ['owner', 'member'] })
  role: 'owner' | 'member';

  /**
   * 应用图标
   */
  @ApiProperty({ description: '应用图标', required: false })
  icon?: string;
}

/**
 * 用户应用列表响应 DTO
 */
export class UserAppsResponseDto {
  /**
   * 应用实例列表
   */
  @ApiProperty({ description: '用户可访问的应用实例列表', type: [AppInstanceItemDto] })
  apps: AppInstanceItemDto[];
}

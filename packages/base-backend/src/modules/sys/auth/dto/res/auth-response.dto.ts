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

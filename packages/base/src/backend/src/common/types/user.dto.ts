/**
 * @fileoverview 用户 DTO
 * @description 从 JWT Token 中解析的用户信息，用于 @User() 装饰器
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户 DTO
 * @description 从请求中获取的用户信息，由 AuthGuard 从 JWT Token 解析注入
 */
export class UserDto {
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
   * 角色 ID 列表
   */
  @ApiProperty({ description: '角色 ID 列表', type: [String], required: false })
  roleIds?: string[];
}
/**
 * @fileoverview 用户响应 DTO
 * @description 用户信息的响应数据结构
 */

import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ImageResourceDto } from '@/common';

/**
 * 用户响应 DTO
 */
export class UserResponseDto {
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
   * 邮箱
   */
  @ApiProperty({ description: '邮箱' })
  @Expose()
  email: string;

  /**
   * 头像
   */
  @ApiProperty({ description: '头像', type: ImageResourceDto })
  @Expose()
  avatar: ImageResourceDto;

  /**
   * 性别 (0:未知 1:男 2:女)
   */
  @ApiProperty({ description: '性别 (0:未知 1:男 2:女)' })
  @Expose()
  gender: number;

  /**
   * 状态 (1:启用 0:禁用)
   */
  @ApiProperty({ description: '状态 (1:启用 0:禁用)' })
  @Expose()
  userStatus: number;

  /**
   * 是否开发者 (1:是 0:否)
   */
  @ApiProperty({ description: '是否开发者 (1:是 0:否)' })
  @Expose()
  isDeveloper: number;

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

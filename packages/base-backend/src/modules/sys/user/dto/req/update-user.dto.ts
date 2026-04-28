/**
 * @fileoverview 更新用户请求 DTO
 * @description 更新用户的请求参数
 */

import { ImageResourceDto } from '@/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, Length } from 'class-validator';

/**
 * 更新用户请求 DTO
 */
export class UpdateUserDto {
  /**
   * 昵称
   */
  @ApiProperty({ description: '昵称', required: false })
  @IsOptional()
  @IsString()
  nickname?: string;

  /**
   * 手机号
   */
  @ApiProperty({ description: '手机号', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 20, { message: '手机号长度应在 20 字符以内' })
  phone?: string;

  /**
   * 邮箱
   */
  @ApiProperty({ description: '邮箱', required: false })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  /**
   * 头像
   */
  @ApiProperty({ description: '头像', required: false, type: ImageResourceDto })
  @IsOptional()
  avatar?: ImageResourceDto;

  /**
   * 性别 (0:未知 1:男 2:女)
   */
  @ApiProperty({ description: '性别 (0:未知 1:男 2:女)', required: false })
  @IsOptional()
  gender?: number;

  /**
   * 角色 ID 列表
   */
  @ApiProperty({ description: '角色 ID 列表', required: false, type: [String] })
  @IsOptional()
  @IsString({ each: true })
  roleIds?: string[];
}

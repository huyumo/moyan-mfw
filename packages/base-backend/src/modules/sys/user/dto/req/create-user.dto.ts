/**
 * @fileoverview 创建用户请求 DTO
 * @description 创建用户的请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEmail, Length, Matches } from 'class-validator';

/**
 * 创建用户请求 DTO
 */
export class CreateUserDto {
  /**
   * 用户名
   */
  @ApiProperty({ description: '用户名', example: 'zhangsan' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  @Length(2, 64, { message: '用户名长度应在 2-64 字符之间' })
  username: string;

  /**
   * 密码
   */
  @ApiProperty({ description: '密码', example: 'Test@123' })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString()
  @Length(6, 32, { message: '密码长度应在 6-32 字符之间' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/, {
    message: '密码必须包含至少一个字母和一个数字',
  })
  password: string;

  /**
   * 昵称
   */
  @ApiProperty({ description: '昵称', example: '张三', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 64, { message: '昵称长度应在 1-64 字符之间' })
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
  @ApiProperty({ description: '头像', required: false })
  @IsOptional()
  avatar?: { src: string; width: number; height: number };

  /**
   * 性别 (0:未知 1:男 2:女)
   */
  @ApiProperty({ description: '性别 (0:未知 1:男 2:女)', default: 0, required: false })
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

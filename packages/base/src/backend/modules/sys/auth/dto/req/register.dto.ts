/**
 * @fileoverview 用户注册请求 DTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsEmail, Matches } from 'class-validator';

/**
 * 用户自注册请求 DTO
 */
export class RegisterDto {
  @ApiProperty({
    description: '用户名',
    example: 'testuser',
    minLength: 3,
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(3, { message: '用户名最少 3 个字符' })
  @MaxLength(64, { message: '用户名最多 64 个字符' })
  username: string;

  @ApiProperty({
    description: '密码',
    example: 'Password123!',
    minLength: 6,
    maxLength: 32,
  })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码最少 6 个字符' })
  @MaxLength(32, { message: '密码最多 32 个字符' })
  password: string;

  @ApiProperty({
    description: '昵称',
    example: '测试用户',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: '昵称最多 50 个字符' })
  nickname?: string;

  @ApiProperty({
    description: '邮箱',
    example: 'test@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiProperty({
    description: '手机号',
    example: '13800138000',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;
}
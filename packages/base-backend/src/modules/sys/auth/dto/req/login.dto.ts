/**
 * @fileoverview 登录请求 DTO
 * @description 用户登录请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

/**
 * 登录请求 DTO
 */
export class LoginDto {
  /**
   * 用户名
   */
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  @Length(2, 64, { message: '用户名长度应在 2-64 字符之间' })
  username: string;

  /**
   * 密码
   */
  @ApiProperty({ description: '密码', example: '123456' })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString()
  @Length(6, 32, { message: '密码长度应在 6-32 字符之间' })
  password: string;
}

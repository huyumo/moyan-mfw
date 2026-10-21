/**
 * @fileoverview 创建用户请求 DTO
 * @description 创建用户的请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEmail, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserBaseDto } from './user-base.dto';

/**
 * 创建用户请求 DTO
 */
export class CreateUserDto extends UserBaseDto {
  @ApiProperty({ description: '用户名', example: 'zhangsan' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  @Length(2, 64, { message: '用户名长度应在 2-64 字符之间' })
  username: string;

  @ApiProperty({ description: '密码', example: 'Test@123' })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString()
  @Length(6, 32, { message: '密码长度应在 6-32 字符之间' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/, {
    message: '密码必须包含至少一个字母和一个数字',
  })
  password: string;

  @ApiProperty({ description: '手机号', required: false })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : value))
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;

  @ApiProperty({ description: '邮箱', required: false })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;
}
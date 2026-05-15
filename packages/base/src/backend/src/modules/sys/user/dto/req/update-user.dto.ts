/**
 * @fileoverview 更新用户请求 DTO
 * @description 更新用户的请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, Length } from 'class-validator';
import { UserBaseDto } from './user-base.dto';

/**
 * 更新用户请求 DTO
 */
export class UpdateUserDto extends UserBaseDto {
  @ApiProperty({ description: '手机号', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 20, { message: '手机号长度应在 20 字符以内' })
  phone?: string;

  @ApiProperty({ description: '邮箱', required: false })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;
}

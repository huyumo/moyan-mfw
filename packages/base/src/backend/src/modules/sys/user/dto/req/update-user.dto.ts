/**
 * @fileoverview 更新用户请求 DTO
 * @description 更新用户的请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEmail, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserBaseDto } from './user-base.dto';

/**
 * 更新用户请求 DTO
 */
export class UpdateUserDto extends UserBaseDto {
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

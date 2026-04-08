/**
 * @fileoverview 初始化请求 DTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * 初始化请求 DTO
 */
export class InitRequestDto {
  @ApiProperty({ description: '管理员密码', example: 'Admin@123', minLength: 8, maxLength: 32 })
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  adminPassword: string;
}

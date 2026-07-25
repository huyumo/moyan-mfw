/**
 * @fileoverview 初始化请求 DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional, IsBoolean } from 'class-validator';

/**
 * 初始化请求 DTO
 */
export class InitRequestDto {
  @ApiProperty({ description: '管理员密码', example: 'Admin@123', minLength: 8, maxLength: 32 })
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  adminPassword: string;

  @ApiPropertyOptional({
    description:
      '是否强制重新初始化（将清空现有数据）。需服务端 ALLOW_FORCE_INSTALL=true 才生效，默认 false。',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

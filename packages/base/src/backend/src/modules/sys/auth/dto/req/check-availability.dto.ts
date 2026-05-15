/**
 * @fileoverview 检查可用性请求 DTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

/**
 * 检查用户名/邮箱/手机号可用性请求 DTO
 */
export class CheckAvailabilityDto {
  @ApiProperty({
    description: '用户名',
    required: false,
    example: 'testuser',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    description: '邮箱',
    required: false,
    example: 'test@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    description: '手机号',
    required: false,
    example: '13800138000',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}

/**
 * 检查可用性响应 DTO
 */
export class CheckAvailabilityResponseDto {
  @ApiProperty({
    description: '用户名是否可用',
    example: true,
  })
  usernameAvailable?: boolean;

  @ApiProperty({
    description: '邮箱是否可用',
    example: true,
  })
  emailAvailable?: boolean;

  @ApiProperty({
    description: '手机号是否可用',
    example: true,
  })
  phoneAvailable?: boolean;
}
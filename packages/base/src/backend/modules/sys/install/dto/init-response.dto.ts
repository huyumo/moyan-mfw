/**
 * @fileoverview 初始化响应 DTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * 初始化响应 DTO
 */
export class InitResponseDto {
  @ApiProperty({ description: '应用类型 ID', example: 'f7eecf8d-0576-4935-bbc9-ca22b9b4bb9f' })
  @IsString()
  appTypeId: string;

  @ApiProperty({ description: '应用实例 ID', example: 'e38ef2a3-e5b4-4b9f-a4f3-1b5e15dc8814' })
  @IsString()
  appId: string;

  @ApiProperty({ description: '管理员用户 ID', example: '38deb03d-615b-4ade-93d0-e173d1af40d1' })
  @IsString()
  adminUserId: string;

  @ApiProperty({ description: '初始化消息', example: '初始化成功' })
  @IsString()
  message: string;
}

/**
 * 初始化状态响应 DTO
 */
export class InitStatusResponseDto {
  @ApiProperty({ description: '是否已初始化', example: false })
  @IsString()
  initialized: boolean;
}

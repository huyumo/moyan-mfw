/**
 * @fileoverview 刷新 Token 请求 DTO
 * @description 刷新 Token 请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 刷新 Token 请求 DTO
 */
export class RefreshTokenDto {
  /**
   * 刷新 Token
   */
  @ApiProperty({ description: '刷新 Token' })
  @IsNotEmpty({ message: '刷新 Token 不能为空' })
  @IsString()
  refreshToken: string;
}

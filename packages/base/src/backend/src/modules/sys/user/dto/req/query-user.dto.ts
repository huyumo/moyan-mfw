/**
 * @fileoverview 用户查询参数 DTO
 * @description 用户列表查询参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt } from 'class-validator';
import { PaginationQueryDto } from '../../../../../common';

/**
 * 用户查询参数 DTO
 */
export class QueryUserDto extends PaginationQueryDto {
  /**
   * 用户名（模糊查询）
   */
  @ApiProperty({ description: '用户名（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  username?: string;

  /**
   * 手机号
   */
  @ApiProperty({ description: '手机号', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  /**
   * 状态 (1:启用 0:禁用)
   */
  @ApiProperty({ description: '状态 (1:启用 0:禁用)', required: false })
  @IsOptional()
  @IsInt()
  userStatus?: number;
}

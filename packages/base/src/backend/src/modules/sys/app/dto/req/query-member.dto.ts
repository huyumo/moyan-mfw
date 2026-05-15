/**
 * @fileoverview 成员查询参数 DTO
 * @description 成员列表查询参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../../../common';

/**
 * 成员查询参数 DTO
 * @description 继承自 PaginationQueryDto，自动获得分页参数
 */
export class QueryMemberDto extends PaginationQueryDto {
  /**
   * 用户昵称（模糊查询）
   */
  @ApiProperty({ description: '用户昵称（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  nickname?: string;

  /**
   * 用户名（模糊查询）
   */
  @ApiProperty({ description: '用户名（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  username?: string;
}
/**
 * @fileoverview 添加成员请求 DTO
 * @description 添加应用成员的请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * 添加成员请求 DTO
 */
export class AddMemberDto {
  /**
   * 用户 ID
   */
  @ApiProperty({ description: '用户 ID' })
  @IsNotEmpty({ message: '用户 ID 不能为空' })
  @IsUUID()
  userId: string;
}

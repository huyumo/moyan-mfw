/**
 * @fileoverview 变更应用负责人请求 DTO
 * @description 变更应用实例负责人的请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * 变更应用负责人请求 DTO
 */
export class ChangeAppOwnerDto {
  /**
   * 新负责人 ID
   */
  @ApiProperty({ description: '新负责人 ID' })
  @IsNotEmpty({ message: '新负责人 ID 不能为空' })
  @IsUUID()
  ownerId: string;
}

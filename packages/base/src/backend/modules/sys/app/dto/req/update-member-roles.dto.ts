/**
 * @fileoverview 更新成员角色请求 DTO
 * @description 更新应用成员角色的请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsArray, IsUUID } from 'class-validator';

/**
 * 更新成员角色请求 DTO
 */
export class UpdateMemberRolesDto {
  /**
   * 角色 ID 列表（全量替换）
   */
  @ApiProperty({ description: '角色 ID 列表（全量替换）', isArray: true })
  @IsNotEmpty({ message: '角色 ID 列表不能为空' })
  @IsArray({ message: '角色 ID 必须是数组' })
  @IsUUID('4', { each: true, message: '角色 ID 必须是有效的 UUID' })
  roleIds: string[];
}
/**
 * @fileoverview 用户权限菜单请求 DTO
 * @description 用户获取权限菜单的请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * 用户权限菜单请求 DTO
 * @description 获取用户在指定应用实例下的权限菜单
 */
export class UserPermissionsDto {
  /**
   * 应用实例 ID
   */
  @IsUUID()
  @ApiProperty({
    description: '应用实例 ID',
    example: 'app-instance-uuid',
  })
  appId: string;
}
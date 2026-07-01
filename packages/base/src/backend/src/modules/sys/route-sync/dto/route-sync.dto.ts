/**
 * @fileoverview 路由同步 DTO
 * @description 路由同步接口的响应数据结构
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * 路由同步检查响应
 */
export class CheckSyncResponseDto {
  @ApiProperty({ description: '是否需要同步' })
  needsSync: boolean;
}

/**
 * 路由同步结果
 */
export class SyncResultDto {
  @ApiProperty({ description: '是否跳过同步' })
  skipped: boolean;

  @ApiProperty({ description: '已同步的应用类型编码列表', type: [String] })
  syncedAppTypes: string[];

  @ApiProperty({ description: '权限变动数量' })
  permissionCount: number;

  @ApiProperty({ description: '权限池记录数量' })
  poolCount: number;

  @ApiProperty({ description: '角色权限记录数量' })
  rolePermCount: number;
}

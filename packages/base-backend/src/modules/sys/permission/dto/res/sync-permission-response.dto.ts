/**
 * @fileoverview 权限同步响应 DTO
 * @description 权限同步的响应结果
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * 差异项 DTO
 */
export class DiffItemDto {
  /**
   * 差异类型
   */
  @ApiProperty({ description: '差异类型', enum: ['added', 'updated', 'removed', 'moved'] })
  type: 'added' | 'updated' | 'removed' | 'moved';

  /**
   * 权限编码
   */
  @ApiProperty({ description: '权限编码', example: 'system:user-list', required: false })
  permCode?: string;

  /**
   * 权限名称
   */
  @ApiProperty({ description: '权限名称', example: '用户列表', required: false })
  permName?: string;

  /**
   * 路由路径
   */
  @ApiProperty({ description: '路由路径', example: '/sys/user', required: false })
  routePath?: string;

  /**
   * 建议操作
   */
  @ApiProperty({ description: '建议操作', example: '新增权限' })
  suggestion: string;
}

/**
 * 同步详情 DTO
 */
export class SyncDetailDto {
  /**
   * 操作类型
   */
  @ApiProperty({ description: '操作类型', enum: ['add', 'update', 'skip'] })
  type: 'add' | 'update' | 'skip';

  /**
   * 权限名称
   */
  @ApiProperty({ description: '权限名称', example: '用户管理' })
  permName: string;

  /**
   * 权限编码
   */
  @ApiProperty({ description: '权限编码', example: 'system:user' })
  permCode: string;

  /**
   * 节点类型
   */
  @ApiProperty({ description: '节点类型', enum: ['MENU', 'PAGE'] })
  nodeType: 'MENU' | 'PAGE';

  /**
   * 父权限编码
   */
  @ApiProperty({ description: '父权限编码', required: false })
  parentCode?: string;
}

/**
 * 权限同步响应 DTO
 */
export class SyncPermissionResponseDto {
  /**
   * 是否预览模式
   */
  @ApiProperty({ description: '是否预览模式', example: false })
  dryRun: boolean;

  /**
   * 新增数量
   */
  @ApiProperty({ description: '新增数量', example: 3 })
  added: number;

  /**
   * 更新数量
   */
  @ApiProperty({ description: '更新数量', example: 2 })
  updated: number;

  /**
   * 跳过数量
   */
  @ApiProperty({ description: '跳过数量', example: 5 })
  skipped: number;

  /**
   * 同步详情
   */
  @ApiProperty({ description: '同步详情', type: [SyncDetailDto] })
  details: SyncDetailDto[];
}

/**
 * 权限比对此 DTO
 */
export class ComparePermissionResponseDto {
  /**
   * 新增的权限
   */
  @ApiProperty({ description: '新增的权限', type: [DiffItemDto] })
  added: DiffItemDto[];

  /**
   * 更新的权限
   */
  @ApiProperty({ description: '更新的权限', type: [DiffItemDto] })
  updated: DiffItemDto[];

  /**
   * 删除的权限
   */
  @ApiProperty({ description: '删除的权限', type: [DiffItemDto] })
  removed: DiffItemDto[];

  /**
   * 移动的权限
   */
  @ApiProperty({ description: '移动的权限', type: [DiffItemDto] })
  moved: DiffItemDto[];

  /**
   * 总差异数量
   */
  @ApiProperty({ description: '总差异数量', example: 5 })
  totalDiffs: number;
}

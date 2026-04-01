/**
 * @fileoverview 分配权限请求 DTO
 * @description 为角色分配权限的请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 权限项 DTO
 */
class PermissionItemDto {
  /**
   * 权限 ID
   */
  @ApiProperty({ description: '权限 ID' })
  @IsNotEmpty()
  @IsString()
  permissionId: string;

  /**
   * 权限值（位运算）
   */
  @ApiProperty({ description: '权限值（位运算）', example: 15 })
  @IsNotEmpty()
  permissionValue: bigint;
}

/**
 * 分配权限请求 DTO
 */
export class AssignPermissionsDto {
  /**
   * 权限列表
   */
  @ApiProperty({ description: '权限列表', type: [PermissionItemDto] })
  @IsNotEmpty({ message: '权限列表不能为空' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionItemDto)
  permissions: PermissionItemDto[];
}

/**
 * @fileoverview 更新角色请求 DTO
 * @description 更新角色的请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

/**
 * 更新角色请求 DTO
 */
export class UpdateRoleDto {
  /**
   * 角色名称
   */
  @ApiProperty({ description: '角色名称', required: false })
  @IsOptional()
  @IsString()
  roleName?: string;

  /**
   * 角色描述
   */
  @ApiProperty({ description: '角色描述', required: false })
  @IsOptional()
  @IsString()
  roleDesc?: string;

  /**
   * 排序号
   */
  @ApiProperty({ description: '排序号', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  /**
   * 角色状态 (1:启用 0:禁用)
   */
  @ApiProperty({ description: '角色状态 (1:启用 0:禁用)', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  roleStatus?: number;
}

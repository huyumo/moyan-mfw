/**
 * @fileoverview 创建角色请求 DTO
 * @description 创建角色的请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

/**
 * 创建角色请求 DTO
 */
export class CreateRoleDto {
  /**
   * 角色名称
   */
  @ApiProperty({ description: '角色名称', example: '管理员' })
  @IsNotEmpty({ message: '角色名称不能为空' })
  @IsString()
  @IsNotEmpty()
  roleName: string;

  /**
   * 角色编码
   */
  @ApiProperty({ description: '角色编码', example: 'admin' })
  @IsNotEmpty({ message: '角色编码不能为空' })
  @IsString()
  roleCode: string;

  /**
   * 角色描述
   */
  @ApiProperty({ description: '角色描述', required: false })
  @IsOptional()
  @IsString()
  roleDesc?: string;

  /**
   * 应用类型 ID
   */
  @ApiProperty({ description: '应用类型 ID', required: false })
  @IsOptional()
  @IsString()
  appTypeId?: string;

  /**
   * 应用实例 ID
   */
  @ApiProperty({ description: '应用实例 ID', required: false })
  @IsOptional()
  @IsString()
  appId?: string;

  /**
   * 排序号
   */
  @ApiProperty({ description: '排序号', default: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number = 0;

  /**
   * 是否内置
   */
  @ApiProperty({ description: '是否内置', default: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  isBuiltin?: number = 0;
}

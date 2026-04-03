/**
 * @fileoverview 权限同步请求 DTO
 * @description 同步路由到权限的请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 路由节点 DTO
 */
export class RouteNodeDto {
  /**
   * 路由路径
   */
  @ApiProperty({ description: '路由路径', example: '/sys/user' })
  @IsNotEmpty({ message: '路由路径不能为空' })
  @IsString()
  path: string;

  /**
   * 路由名称
   */
  @ApiProperty({ description: '路由名称', example: '用户管理' })
  @IsNotEmpty({ message: '路由名称不能为空' })
  @IsString()
  name: string;

  /**
   * 子路由
   */
  @ApiProperty({ description: '子路由', required: false, type: () => [RouteNodeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteNodeDto)
  children?: RouteNodeDto[];
}

/**
 * 权限同步请求 DTO
 */
export class SyncPermissionDto {
  /**
   * 应用类型 ID
   */
  @ApiProperty({ description: '应用类型 ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsNotEmpty({ message: '应用类型 ID 不能为空' })
  @IsString()
  appTypeId: string;

  /**
   * 是否仅预览（不执行实际同步）
   */
  @ApiProperty({ description: '是否仅预览，默认 false', default: false, required: false })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean = false;

  /**
   * 路由树结构
   */
  @ApiProperty({ description: '路由树结构', type: [RouteNodeDto] })
  @IsNotEmpty({ message: '路由数据不能为空' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteNodeDto)
  routes: RouteNodeDto[];
}

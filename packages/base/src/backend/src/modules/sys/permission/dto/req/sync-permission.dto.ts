/**
 * @fileoverview 权限同步请求 DTO
 * @description 同步路由到权限的请求参数
 *
 * 注意：同步路由只是将路由转换为 Permission 实体数据，不涉及应用类型绑定。
 * 应用类型绑定是在"应用类型管理页面"的"权限池配置"中完成的。
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
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
   * 权限值（位运算字符串，如 "6"）
   */
  @ApiProperty({ description: '权限值（位运算）', required: false, example: '6' })
  @IsOptional()
  @IsString()
  permissionValue?: string;

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
   * 路由树结构
   */
  @ApiProperty({ description: '路由树结构', type: [RouteNodeDto] })
  @IsNotEmpty({ message: '路由数据不能为空' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteNodeDto)
  routes: RouteNodeDto[];
}

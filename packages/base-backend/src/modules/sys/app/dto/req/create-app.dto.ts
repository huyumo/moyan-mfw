/**
 * @fileoverview 创建应用请求 DTO
 * @description 创建应用实例的请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, Min, IsUUID } from 'class-validator';

/**
 * 创建应用请求 DTO
 */
export class CreateAppDto {
  /**
   * 应用类型 ID
   */
  @ApiProperty({ description: '应用类型 ID' })
  @IsNotEmpty({ message: '应用类型 ID 不能为空' })
  @IsUUID()
  appTypeId: string;

  /**
   * 应用名称
   */
  @ApiProperty({ description: '应用名称', example: '商城系统-北京' })
  @IsNotEmpty({ message: '应用名称不能为空' })
  @IsString()
  appName: string;

  /**
   * 应用编码
   */
  @ApiProperty({ description: '应用编码', example: 'mall-beijing' })
  @IsNotEmpty({ message: '应用编码不能为空' })
  @IsString()
  appCode: string;

  /**
   * 拥有者 ID
   */
  @ApiProperty({ description: '拥有者 ID' })
  @IsNotEmpty({ message: '拥有者 ID 不能为空' })
  @IsUUID()
  ownerId: string;

  /**
   * 应用描述
   */
  @ApiProperty({ description: '应用描述', required: false })
  @IsOptional()
  @IsString()
  appDesc?: string;

  /**
   * 应用图标
   */
  @ApiProperty({ description: '应用图标 URL 或图标名称', required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  /**
   * 排序号
   */
  @ApiProperty({ description: '排序号', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number = 0;
}

/**
 * @fileoverview 创建应用类型请求 DTO
 * @description 创建应用类型的请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

/**
 * 创建应用类型请求 DTO
 */
export class CreateAppTypeDto {
  /**
   * 类型名称
   */
  @ApiProperty({ description: '类型名称', example: 'Web 应用' })
  @IsNotEmpty({ message: '类型名称不能为空' })
  @IsString()
  typeName: string;

  /**
   * 类型编码
   */
  @ApiProperty({ description: '类型编码', example: 'web' })
  @IsNotEmpty({ message: '类型编码不能为空' })
  @IsString()
  typeCode: string;

  /**
   * 类型描述
   */
  @ApiProperty({ description: '类型描述', required: false })
  @IsOptional()
  @IsString()
  typeDesc?: string;

  /**
   * 图标
   */
  @ApiProperty({ description: '图标 URL 或图标名称', required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  /**
   * 是否支持多应用
   */
  @ApiProperty({ description: '是否支持多应用', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  multiAppEnabled?: number = 0;

  /**
   * 类型状态
   */
  @ApiProperty({ description: '类型状态', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  typeStatus?: number = 1;

  /**
   * 排序号
   */
  @ApiProperty({ description: '排序号', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number = 0;
}

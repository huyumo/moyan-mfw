/**
 * @fileoverview 更新应用类型请求 DTO
 * @description 更新应用类型的请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

/**
 * 更新应用类型请求 DTO
 */
export class UpdateAppTypeDto {
  /**
   * 类型名称
   */
  @ApiProperty({ description: '类型名称', required: false })
  @IsOptional()
  @IsString()
  typeName?: string;

  /**
   * 类型编码
   */
  @ApiProperty({ description: '类型编码', required: false })
  @IsOptional()
  @IsString()
  typeCode?: string;

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
  @ApiProperty({ description: '是否支持多应用', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  multiAppEnabled?: number;

  /**
   * 类型状态
   */
  @ApiProperty({ description: '类型状态', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  typeStatus?: number;

  /**
   * 排序号
   */
  @ApiProperty({ description: '排序号', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

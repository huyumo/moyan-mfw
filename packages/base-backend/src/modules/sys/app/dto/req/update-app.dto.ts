/**
 * @fileoverview 更新应用请求 DTO
 * @description 更新应用实例的请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, IsUUID, IsBoolean } from 'class-validator';

/**
 * 更新应用请求 DTO
 */
export class UpdateAppDto {
  /**
   * 应用编码
   */
  @ApiProperty({ description: '应用编码', required: false })
  @IsOptional()
  @IsString()
  appCode?: string;

  /**
   * 应用名称
   */
  @ApiProperty({ description: '应用名称', required: false })
  @IsOptional()
  @IsString()
  appName?: string;

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
   * 拥有者 ID（变更负责人时使用）
   */
  @ApiProperty({ description: '拥有者 ID（变更负责人时使用）', required: false })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  /**
   * 应用状态
   */
  @ApiProperty({ description: '应用状态 (1:启用 0:禁用)', required: false, enum: [0, 1] })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Min(1)
  appStatus?: number;

  /**
   * 排序号
   */
  @ApiProperty({ description: '排序号', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

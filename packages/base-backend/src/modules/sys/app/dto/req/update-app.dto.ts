/**
 * @fileoverview 更新应用请求 DTO
 * @description 更新应用实例的请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, IsUUID, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ImageResourceDto } from '@/common';

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
   * 应用 Logo
   */
  @ApiProperty({ description: '应用 Logo', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ImageResourceDto)
  logo?: ImageResourceDto;

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

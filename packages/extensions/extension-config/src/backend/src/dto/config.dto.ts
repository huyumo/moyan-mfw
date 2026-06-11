/**
 * @fileoverview 配置管理 DTO 定义
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional, IsString, IsNumber, IsEnum, IsObject,
  ValidateNested, IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConfigType } from 'moyan-mfw-extension-config/shared';

export class ConfigValueDto {
  @ApiProperty({ description: '配置数据' })
  @IsObject()
  data: any;
}

export class BatchUpdateItemDto {
  @ApiProperty({ description: '配置项标识' })
  @IsNotEmpty({ message: '配置项标识不能为空' })
  @IsString()
  configKey: string;

  @ApiProperty({ description: '配置值' })
  @ValidateNested()
  @Type(() => ConfigValueDto)
  configValue: { data: any };

  @ApiPropertyOptional({ description: '配置描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '配置类型（不传则保持原有）', enum: ConfigType })
  @IsOptional()
  @IsEnum(ConfigType)
  configType?: ConfigType;
}

export class CreateConfigDto {
  @ApiPropertyOptional({ description: '应用 ID，NULL 表示全局配置' })
  @IsOptional()
  @IsNumber()
  appId: number | null;

  @ApiProperty({ description: '配置分组标识' })
  @IsNotEmpty({ message: '分组标识不能为空' })
  @IsString()
  groupKey: string;

  @ApiProperty({ description: '配置项标识' })
  @IsNotEmpty({ message: '配置项标识不能为空' })
  @IsString()
  configKey: string;

  @ApiProperty({ description: '配置值' })
  @ValidateNested()
  @Type(() => ConfigValueDto)
  configValue: { data: any };

  @ApiProperty({ description: '配置类型', enum: ConfigType })
  @IsEnum(ConfigType)
  configType: ConfigType;

  @ApiPropertyOptional({ description: '配置描述' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class BatchUpdateConfigDto {
  @ApiProperty({ description: '配置分组标识' })
  @IsNotEmpty({ message: '分组标识不能为空' })
  @IsString()
  groupKey: string;

  @ApiPropertyOptional({ description: '应用 ID，NULL 表示全局配置' })
  @IsOptional()
  @IsNumber()
  appId: number | null;

  @ApiProperty({ description: '配置项列表', type: [BatchUpdateItemDto] })
  @ValidateNested({ each: true })
  @Type(() => BatchUpdateItemDto)
  items: BatchUpdateItemDto[];
}

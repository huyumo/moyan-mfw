/**
 * @fileoverview 保存自定义菜单 DTO
 * @description 保存应用类型的自定义菜单配置
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CustomMenuItemDto {
  @ApiProperty({ description: '权限编码' })
  @IsString()
  @IsNotEmpty()
  permCode: string;

  @ApiProperty({ description: '菜单名称' })
  @IsString()
  @IsNotEmpty()
  permName: string;

  @ApiProperty({ description: '图标', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ description: '路由路径', required: false })
  @IsString()
  @IsOptional()
  routePath?: string;

  @ApiProperty({ description: '排序', required: false })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiProperty({ description: '子节点', required: false, type: [CustomMenuItemDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CustomMenuItemDto)
  children?: CustomMenuItemDto[];
}

export class SaveCustomMenuDto {
  @ApiProperty({ description: '自定义菜单节点数组', type: [CustomMenuItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomMenuItemDto)
  data: CustomMenuItemDto[];
}

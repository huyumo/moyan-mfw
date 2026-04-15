/**
 * @fileoverview 权限池更新请求 DTO
 * @description 更新应用类型权限池配置的请求参数
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 权限树节点请求体
 * @description 用于提交权限节点的勾选状态和权限值
 */
export class PermissionTreePayloadDto {
  /**
   * 权限 ID
   */
  @ApiProperty({ description: '权限 ID' })
  @IsString()
  id: string;

  /**
   * 是否选中
   * @description true=加入权限池，false=移除
   */
  @ApiProperty({ description: '是否选中（true=加入权限池，false=移除）' })
  @IsBoolean()
  checked: boolean;

  /**
   * 权限值
   * @description 位运算权限值，十进制字符串格式
   */
  @ApiPropertyOptional({ description: '权限值（位运算权限值，十进制字符串格式）' })
  @IsOptional()
  @IsString()
  permissionValue?: string;

  /**
   * 子节点
   */
  @ApiPropertyOptional({ description: '子节点列表', type: [PermissionTreePayloadDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionTreePayloadDto)
  children?: PermissionTreePayloadDto[];
}

/**
 * 权限树请求体
 * @description 包含 PC 权限树和普通权限树
 */
export class PermissionTreesDto {
  /**
   * PC 权限树
   */
  @ApiProperty({ description: 'PC 权限树', type: [PermissionTreePayloadDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionTreePayloadDto)
  pcTree: PermissionTreePayloadDto[];

  /**
   * 普通权限树
   */
  @ApiProperty({ description: '普通权限树', type: [PermissionTreePayloadDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionTreePayloadDto)
  normalTree: PermissionTreePayloadDto[];
}

/**
 * 更新权限池请求 DTO
 * @description 更新应用类型权限池配置
 */
export class UpdatePermissionPoolDto {
  /**
   * 权限树配置
   */
  @ApiProperty({ description: '权限树配置', type: PermissionTreesDto })
  @ValidateNested()
  @Type(() => PermissionTreesDto)
  permissionTrees: PermissionTreesDto;
}
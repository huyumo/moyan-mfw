/**
 * @fileoverview 应用类型响应 DTO
 * @description 应用类型信息的响应数据结构
 */

import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * 应用类型响应 DTO
 */
export class AppTypeResponseDto {
  /**
   * 应用类型 ID
   */
  @ApiProperty({ description: '应用类型 ID' })
  @Expose()
  id: string;

  /**
   * 类型名称
   */
  @ApiProperty({ description: '类型名称' })
  @Expose()
  typeName: string;

  /**
   * 类型编码
   */
  @ApiProperty({ description: '类型编码' })
  @Expose()
  typeCode: string;

  /**
   * 类型描述
   */
  @ApiProperty({ description: '类型描述' })
  @Expose()
  typeDesc: string;

  /**
   * 图标
   */
  @ApiProperty({ description: '图标' })
  @Expose()
  icon: string;

  /**
   * 是否支持多应用
   */
  @ApiProperty({ description: '是否支持多应用' })
  @Expose()
  multiAppEnabled: number;

  /**
   * 类型状态
   */
  @ApiProperty({ description: '类型状态' })
  @Expose()
  typeStatus: number;

  /**
   * 排序号
   */
  @ApiProperty({ description: '排序号' })
  @Expose()
  sortOrder: number;

  /**
   * 创建时间
   */
  @ApiProperty({ description: '创建时间' })
  @Expose()
  createdAt: Date;

  /**
   * 更新时间
   */
  @ApiProperty({ description: '更新时间' })
  @Expose()
  updateAt: Date;

  @ApiProperty({ description: '内置角色数量' })
  @Expose()
  builtinRoleCount: number;
}

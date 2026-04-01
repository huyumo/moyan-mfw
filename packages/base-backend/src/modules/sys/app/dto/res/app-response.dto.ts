/**
 * @fileoverview 应用响应 DTO
 * @description 应用实例信息的响应数据结构
 */

import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * 应用响应 DTO
 */
export class AppResponseDto {
  /**
   * 应用 ID
   */
  @ApiProperty({ description: '应用 ID' })
  @Expose()
  id: string;

  /**
   * 应用类型 ID
   */
  @ApiProperty({ description: '应用类型 ID' })
  @Expose()
  appTypeId: string;

  /**
   * 应用名称
   */
  @ApiProperty({ description: '应用名称' })
  @Expose()
  appName: string;

  /**
   * 应用编码
   */
  @ApiProperty({ description: '应用编码' })
  @Expose()
  appCode: string;

  /**
   * 应用描述
   */
  @ApiProperty({ description: '应用描述' })
  @Expose()
  appDesc: string;

  /**
   * 拥有者 ID
   */
  @ApiProperty({ description: '拥有者 ID' })
  @Expose()
  ownerId: string;

  /**
   * 应用图标
   */
  @ApiProperty({ description: '应用图标' })
  @Expose()
  icon: string;

  /**
   * 应用状态
   */
  @ApiProperty({ description: '应用状态' })
  @Expose()
  appStatus: number;

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
}

/**
 * 应用详情响应 DTO（包含关联信息）
 */
export class AppDetailResponseDto extends AppResponseDto {
  /**
   * 应用类型信息
   */
  @ApiProperty({ description: '应用类型信息' })
  @Expose()
  appType?: {
    id: string;
    typeName: string;
    typeCode: string;
  };

  /**
   * 拥有者信息
   */
  @ApiProperty({ description: '拥有者信息' })
  @Expose()
  owner?: {
    id: string;
    username: string;
    nickname: string;
    avatar: string;
  };
}

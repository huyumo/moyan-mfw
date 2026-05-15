/**
 * @fileoverview 审计日志响应 DTO
 * @description 审计日志信息的响应数据结构
 */

import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { AuditModule } from '../../../../../../common/decorators/audit-log.decorator';

/**
 * 审计日志响应 DTO
 */
export class AuditLogResponseDto {
  /**
   * 日志 ID
   */
  @ApiProperty({ description: '日志 ID' })
  @Expose()
  id: string;

  /**
   * 所属模块
   */
  @ApiProperty({ description: '所属模块', enum: AuditModule })
  @Expose()
  module: AuditModule;

  /**
   * 事件名称
   */
  @ApiProperty({ description: '事件名称' })
  @Expose()
  event: string;

  /**
   * 操作人 ID
   */
  @ApiProperty({ description: '操作人 ID' })
  @Expose()
  operatorId: string;

  /**
   * 操作人名称
   */
  @ApiProperty({ description: '操作人名称' })
  @Expose()
  operatorName: string;

  /**
   * 目标 ID
   */
  @ApiProperty({ description: '目标 ID' })
  @Expose()
  targetId: string;

  /**
   * 目标类型
   */
  @ApiProperty({ description: '目标类型' })
  @Expose()
  targetType: string;

  /**
   * 描述
   */
  @ApiProperty({ description: '描述' })
  @Expose()
  description: string;

  /**
   * 快照
   */
  @ApiProperty({ description: '快照', required: false })
  @Expose()
  snapshot: {
    before?: any;
    after?: any;
  };

  /**
   * IP 地址
   */
  @ApiProperty({ description: 'IP 地址' })
  @Expose()
  ip: string;

  /**
   * User-Agent
   */
  @ApiProperty({ description: 'User-Agent', required: false })
  @Expose()
  userAgent: string;

  /**
   * 创建时间
   */
  @ApiProperty({ description: '创建时间' })
  @Expose()
  createAt: Date;
}

/**
 * @fileoverview 审计日志查询参数 DTO
 * @description 审计日志列表查询参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { AuditModule } from '../../../../../common/decorators/audit-log.decorator';
import { PaginationQueryDto } from '../../../../../common';

/**
 * 审计日志查询参数 DTO
 * @description 继承自 PaginationQueryDto，自动获得分页参数
 */
export class QueryAuditLogDto extends PaginationQueryDto {
  /**
   * 所属模块
   */
  @ApiProperty({ description: '所属模块', enum: AuditModule, required: false })
  @IsOptional()
  @IsEnum(AuditModule)
  module?: AuditModule;

  /**
   * 事件名称
   */
  @ApiProperty({ description: '事件名称', required: false })
  @IsOptional()
  @IsString()
  event?: string;

  /**
   * 操作人 ID
   */
  @ApiProperty({ description: '操作人 ID', required: false })
  @IsOptional()
  @IsString()
  operatorId?: string;

  /**
   * 目标 ID
   */
  @ApiProperty({ description: '目标 ID', required: false })
  @IsOptional()
  @IsString()
  targetId?: string;

  /**
   * 开始时间
   */
  @ApiProperty({ description: '开始时间', required: false })
  @IsOptional()
  @IsString()
  startTime?: string;

  /**
   * 结束时间
   */
  @ApiProperty({ description: '结束时间', required: false })
  @IsOptional()
  @IsString()
  endTime?: string;

  /**
   * 排序字段
   * @default 'createAt'
   */
  @ApiProperty({ description: '排序字段', default: 'createAt', required: false })
  @IsOptional()
  @IsString()
  sortField?: string = 'createAt';
}

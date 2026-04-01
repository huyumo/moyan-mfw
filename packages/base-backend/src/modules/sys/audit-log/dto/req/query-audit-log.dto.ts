/**
 * @fileoverview 审计日志查询参数 DTO
 * @description 审计日志列表查询参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { AuditModule } from '../../../../../common/decorators/audit-log.decorator';

/**
 * 审计日志查询参数 DTO
 */
export class QueryAuditLogDto {
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
   * 当前页码
   */
  @ApiProperty({ description: '当前页码', default: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * 每页数量
   */
  @ApiProperty({ description: '每页数量', default: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;
}

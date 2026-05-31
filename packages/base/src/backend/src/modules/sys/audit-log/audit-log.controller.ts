/**
 * @fileoverview 审计日志控制器
 * @description 处理审计日志相关 HTTP 请求
 */

import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { QueryAuditLogDto, AuditLogResponseDto } from './dto';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { ApiResponseUtil } from '../../../common/types/api.types';
import { ApiPaginatedResponse } from '../../../common';

/**
 * 审计日志控制器
 * @description 处理审计日志相关的查询请求
 */
@ApiTags('audit-log', '审计日志相关接口')
@ApiBearerAuth('Authorization')
@Controller('audit-logs')
export class AuditLogController {
  constructor(private auditLogService: AuditLogService) {}

  /**
   * 查询审计日志列表
   */
  @Get()
  @ApiOperation({ summary: '查询审计日志列表', description: '分页查询审计日志列表' })
  @ApiPaginatedResponse(AuditLogResponseDto)
  @RequirePermission({ permCode: 'pc_root:sys:audit-log' })
  async findAll(@Query() query: QueryAuditLogDto) {
    const result = await this.auditLogService.findAll(query);
    return ApiResponseUtil.success(result, '查询成功');
  }

  /**
   * 根据 ID 查询审计日志
   */
  @Get(':id')
  @ApiOperation({ summary: '根据 ID 查询审计日志', description: '查询指定审计日志的详细信息' })
  @ApiParam({ name: 'id', description: '审计日志 ID' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: AuditLogResponseDto,
  })
  @ApiResponse({ status: 404, description: '审计日志不存在' })
  @RequirePermission({ permCode: 'pc_root:sys:audit-log' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.auditLogService.findById(id);
    return ApiResponseUtil.success(result, '查询成功');
  }

  /**
   * 根据目标 ID 查询审计日志列表
   */
  @Get('target/:targetId')
  @ApiOperation({ summary: '根据目标 ID 查询审计日志', description: '查询指定目标的所有审计日志' })
  @ApiParam({ name: 'targetId', description: '目标 ID' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: [AuditLogResponseDto],
  })
  @RequirePermission({ permCode: 'pc_root:sys:audit-log' })
  async findByTargetId(@Param('targetId') targetId: string) {
    const result = await this.auditLogService.findByTargetId(targetId);
    return ApiResponseUtil.success(result, '查询成功');
  }

  /**
   * 根据操作人 ID 查询审计日志列表
   */
  @Get('operator/:operatorId')
  @ApiOperation({ summary: '根据操作人 ID 查询审计日志', description: '查询指定操作人的所有审计日志' })
  @ApiParam({ name: 'operatorId', description: '操作人 ID' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: [AuditLogResponseDto],
  })
  @RequirePermission({ permCode: 'pc_root:sys:audit-log' })
  async findByOperatorId(@Param('operatorId') operatorId: string) {
    const result = await this.auditLogService.findByOperatorId(operatorId);
    return ApiResponseUtil.success(result, '查询成功');
  }

  /**
   * 删除指定时间之前的审计日志
   */
  @Delete('before/:beforeDate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '清理审计日志', description: '删除指定日期之前的审计日志' })
  @ApiParam({ name: 'beforeDate', description: '日期 (YYYY-MM-DD)' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @RequirePermission({ permCode: 'pc_root:sys:audit-log', permissionValue: ['删除'] })
  async deleteBeforeDate(@Param('beforeDate') beforeDate: string) {
    const date = new Date(beforeDate);
    const deleted = await this.auditLogService.deleteBeforeDate(date);
    return ApiResponseUtil.success({ deleted }, `已删除 ${deleted} 条日志`);
  }
}

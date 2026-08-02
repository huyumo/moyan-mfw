/**
 * @fileoverview 定时任务管理控制器
 * @description 提供任务定义、延迟实例、执行日志的管理 API
 */

import {
  Controller, Get, Post, Put,
  Body, Param, Query,
  HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { RequirePermission, ApiPaginatedResponse, SkipPermission } from 'moyan-mfw-base/backend'
import { ApiResponseUtil } from '../api-response'
import { ScheduledTaskService } from '../services/scheduled-task.service'
import {
  UpdateTaskDto,
  TriggerTaskDto,
  InstanceQueryDto,
  LogQueryDto,
  TaskQueryDto,
  ScheduledTaskResponseDto,
  ScheduledTaskInstanceResponseDto,
  ScheduledTaskLogResponseDto,
} from '../dto'

@ApiTags('scheduler', '定时任务管理')
@ApiBearerAuth('Authorization')
@Controller()
export class ScheduledTaskController {
  constructor(private readonly taskService: ScheduledTaskService) {}

  // ── 任务定义 ──

  @Get('tasks')
  @ApiOperation({ summary: '查询任务定义列表', description: '查询所有定时任务定义，支持按名称和类型筛选' })
  @ApiResponse({ status: 200, type: [ScheduledTaskResponseDto] })
  @SkipPermission()
  async listTasks(@Query() query: TaskQueryDto) {
    const result = await this.taskService.listTasks(query)
    return ApiResponseUtil.success(result, '查询成功')
  }

  @Get('tasks/:taskCode')
  @ApiOperation({ summary: '查询任务定义详情' })
  @ApiParam({ name: 'taskCode', description: '任务编码' })
  @SkipPermission()
  async getTask(@Param('taskCode') taskCode: string) {
    const result = await this.taskService.getTaskDetail(taskCode)
    return ApiResponseUtil.success(result, '查询成功')
  }

  @Put('tasks/:taskCode')
  @ApiOperation({ summary: '更新任务定义' })
  @ApiParam({ name: 'taskCode', description: '任务编码' })
  @RequirePermission({ permCode: 'ext:scheduler:task', permissionValue: ['编辑'] })
  async updateTask(
    @Param('taskCode') taskCode: string,
    @Body() dto: UpdateTaskDto,
  ) {
    await this.taskService.updateTask(taskCode, dto)
    return ApiResponseUtil.success(null, '更新成功')
  }

  @Post('tasks/:taskCode/trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '手动触发任务', description: '立即触发指定任务的执行' })
  @ApiParam({ name: 'taskCode', description: '任务编码' })
  @RequirePermission({ permCode: 'ext:scheduler:task', permissionValue: ['执行'] })
  async triggerTask(
    @Param('taskCode') taskCode: string,
    @Body() dto: TriggerTaskDto,
  ) {
    const result = await this.taskService.triggerTask(taskCode, dto.entityId, dto.payload)
    return ApiResponseUtil.success(result, '触发成功')
  }

  // ── 延迟实例 ──

  @Get('instances')
  @ApiOperation({ summary: '查询延迟实例列表', description: '分页查询延迟任务实例' })
  @ApiPaginatedResponse(ScheduledTaskInstanceResponseDto)
  @SkipPermission()
  async listInstances(@Query() query: InstanceQueryDto) {
    const result = await this.taskService.listInstances(query)
    return ApiResponseUtil.success(result, '查询成功')
  }

  @Post('instances/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '取消延迟实例', description: '取消待执行的延迟任务实例' })
  @ApiParam({ name: 'id', description: '实例ID' })
  @RequirePermission({ permCode: 'ext:scheduler:instance', permissionValue: ['编辑'] })
  async cancelInstance(@Param('id') id: string) {
    const result = await this.taskService.cancelInstance(id)
    return ApiResponseUtil.success(result, result ? '取消成功' : '取消失败（实例不存在或已执行）')
  }

  // ── 执行日志 ──

  @Get('logs')
  @ApiOperation({ summary: '查询执行日志列表', description: '分页查询任务执行日志' })
  @ApiPaginatedResponse(ScheduledTaskLogResponseDto)
  @SkipPermission()
  async listLogs(@Query() query: LogQueryDto) {
    const result = await this.taskService.listLogs(query)
    return ApiResponseUtil.success(result, '查询成功')
  }

  @Get('logs/:id')
  @ApiOperation({ summary: '查询日志详情' })
  @ApiParam({ name: 'id', description: '日志ID' })
  @SkipPermission()
  async getLog(@Param('id') id: string) {
    const result = await this.taskService.getLogDetail(id)
    return ApiResponseUtil.success(result, '查询成功')
  }
}

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
import { SchedulerConfigService } from '../services/scheduler-config.service'
import { SchedulerCleanupService } from '../services/scheduler-cleanup.service'
import { ExecutorHeartbeatService } from '../services/executor-heartbeat.service'
import {
  UpdateTaskDto,
  CreateDelayInstanceDto,
  InstanceQueryDto,
  LogQueryDto,
  TaskQueryDto,
  UpdateSchedulerConfigDto,
  ScheduledTaskResponseDto,
  ScheduledTaskInstanceResponseDto,
  ScheduledTaskLogResponseDto,
} from '../dto'

@ApiTags('scheduler', '定时任务管理')
@ApiBearerAuth('Authorization')
@Controller()
export class ScheduledTaskController {
  constructor(
    private readonly taskService: ScheduledTaskService,
    private readonly configService: SchedulerConfigService,
    private readonly cleanupService: SchedulerCleanupService,
    private readonly heartbeat: ExecutorHeartbeatService,
  ) {}

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
  @ApiOperation({ summary: '手动触发任务', description: '立即执行指定任务（不创建实例，执行结果见执行日志，触发方式=手动）' })
  @ApiParam({ name: 'taskCode', description: '任务编码' })
  @RequirePermission({ permCode: 'ext:scheduler:task', permissionValue: ['执行'] })
  async triggerTask(@Param('taskCode') taskCode: string) {
    await this.taskService.triggerTask(taskCode)
    return ApiResponseUtil.success(null, '触发成功')
  }

  // ── 延迟实例 ──

  @Post('instances')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '创建延迟任务实例',
    description: '创建延迟实例：delaySeconds=0（默认）立即执行；或传 executeAt 指定执行时间；失败后按任务配置的 maxRetry/backoffStrategy 重试',
  })
  @RequirePermission({ permCode: 'ext:scheduler:task', permissionValue: ['执行'] })
  async createInstance(@Body() dto: CreateDelayInstanceDto) {
    const executeAt = dto.executeAt
      ? new Date(dto.executeAt)
      : new Date(Date.now() + (dto.delaySeconds ?? 0) * 1000)
    const result = await this.taskService.createDelayInstance(
      dto.taskCode,
      executeAt,
      dto.entityId,
      dto.payload,
    )
    return ApiResponseUtil.success(result, '创建成功')
  }

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

  @Post('instances/:id/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '手动重跑延迟实例', description: '将终态(失败/超时/未归档)实例重置为待执行，保留原始entityId/payload，retryCount+1' })
  @ApiParam({ name: 'id', description: '实例ID' })
  @RequirePermission({ permCode: 'ext:scheduler:instance', permissionValue: ['执行'] })
  async retryInstance(@Param('id') id: string) {
    const result = await this.taskService.retryInstance(id)
    return ApiResponseUtil.success(result, result ? '重跑已触发' : '重跑失败（实例不存在或非终态）')
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

  // ── 系统配置 ──

  @Get('config')
  @ApiOperation({ summary: '查询调度器全局配置', description: '查询清理/崩溃恢复/限流等全局配置' })
  @SkipPermission()
  async getConfig() {
    const result = await this.configService.getConfig()
    return ApiResponseUtil.success(result, '查询成功')
  }

  @Put('config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新调度器全局配置', description: '更新后清除缓存立即生效' })
  @RequirePermission({ permCode: 'ext:scheduler:task', permissionValue: ['编辑'] })
  async updateConfig(@Body() dto: UpdateSchedulerConfigDto) {
    await this.configService.updateConfig(dto as any)
    return ApiResponseUtil.success(null, '更新成功')
  }

  @Post('config/cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '手动清理', description: '立即清理过期终态实例与日志，返回删除数量' })
  @RequirePermission({ permCode: 'ext:scheduler:task', permissionValue: ['编辑'] })
  async manualCleanup() {
    const result = await this.cleanupService.cleanupNow()
    return ApiResponseUtil.success(result, '清理完成')
  }

  // ── 执行器状态（动态分片实时展示） ──

  @Get('executors')
  @ApiOperation({ summary: '查询存活执行器列表', description: '用于展示动态分片状态' })
  @SkipPermission()
  async listExecutors() {
    const result = await this.heartbeat.getAliveExecutors()
    return ApiResponseUtil.success(result, '查询成功')
  }
}

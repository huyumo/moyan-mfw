/**
 * @fileoverview 定时任务创建用例控制器
 * @description 演示通过 ScheduledTaskService 创建 Cron 任务和延迟任务
 *
 * 测试方式（先登录获取 token）：
 *   curl -X POST http://localhost:3000/api/auth/login \
 *     -H "Content-Type: application/json" \
 *     -d '{"username":"admin","password":"Admin@123"}'
 *
 *   # 用例1：查看已注册的处理器
 *   curl http://localhost:3000/api/demo/scheduler/handlers \
 *     -H "Authorization: Bearer <token>"
 *
 *   # 用例2：触发已注册的 Cron 任务
 *   curl -X POST http://localhost:3000/api/demo/scheduler/trigger-cron \
 *     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
 *     -d '{"taskCode":"demo.cron.hello"}'
 *
 *   # 用例3：创建延迟任务（5秒后执行）
 *   curl -X POST http://localhost:3000/api/demo/scheduler/create-delay-task \
 *     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
 *     -d '{"taskCode":"demo.delay.greeting","delaySeconds":5,"payload":{"greeting":"你好","target":"世界"}}'
 *
 *   # 用例4：查看任务定义列表
 *   curl http://localhost:3000/api/demo/scheduler/tasks \
 *     -H "Authorization: Bearer <token>"
 *
 *   # 框架 API：手动触发任务
 *   curl -X POST http://localhost:3000/api/ext/scheduler/tasks/demo.delay.greeting/trigger \
 *     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
 *     -d '{"payload":{"greeting":"你好","target":"世界"}}'
 */

import {
  Controller, Post, Body, Get,
  HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, IsInt, IsObject, IsOptional, Min } from 'class-validator'
import { SkipPermission } from 'moyan-mfw-base/backend'
import { ScheduledTaskService, TaskRegistry } from 'moyan-mfw-extension-scheduler/backend'

// ── DTO ──

class TriggerCronDto {
  @ApiProperty({ description: '任务编码' })
  @IsNotEmpty()
  @IsString()
  taskCode: string

  @ApiProperty({ description: '业务数据', required: false })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>
}

class CreateDelayTaskDto {
  @ApiProperty({ description: '任务编码' })
  @IsNotEmpty()
  @IsString()
  taskCode: string

  @ApiProperty({ description: '延迟秒数' })
  @IsInt()
  @Min(1)
  delaySeconds: number

  @ApiProperty({ description: '业务实体ID', required: false })
  @IsOptional()
  @IsString()
  entityId?: string

  @ApiProperty({ description: '业务数据', required: false })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>
}

@ApiTags('demo-scheduler', '定时任务创建用例')
@ApiBearerAuth('Authorization')
@Controller('demo/scheduler')
export class DemoSchedulerController {
  constructor(
    private readonly taskService: ScheduledTaskService,
    private readonly registry: TaskRegistry,
  ) {}

  /**
   * 用例1：查看已注册的任务处理器列表
   */
  @Get('handlers')
  @ApiOperation({ summary: '查看已注册的任务处理器', description: '列出所有通过 TaskRegistry 注册的 handler' })
  @SkipPermission()
  listHandlers() {
    const handlers = this.registry.getAll().map((h) => ({
      taskCode: h.taskCode,
      taskName: h.taskName,
      taskType: h.taskType,
      defaultCron: h.defaultCron,
      defaultIntervalSeconds: h.defaultIntervalSeconds,
      defaultTimeoutSeconds: h.defaultTimeoutSeconds,
      description: h.description,
    }))
    return { message: `共 ${handlers.length} 个处理器`, handlers }
  }

  /**
   * 用例2：手动触发已注册的 Cron 任务
   * @description 通过 ScheduledTaskService.triggerTask 创建 PENDING 实例
   */
  @Post('trigger-cron')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '手动触发 Cron 任务', description: '创建一个立即执行的实例' })
  async triggerCron(@Body() dto: TriggerCronDto) {
    const handler = this.registry.get(dto.taskCode)
    if (!handler) {
      return { error: `任务处理器未注册: ${dto.taskCode}` }
    }
    const instance = await this.taskService.triggerTask(dto.taskCode, undefined, dto.payload)
    return {
      message: `任务已触发: ${dto.taskCode}`,
      instance,
    }
  }

  /**
   * 用例3：创建延迟任务
   * @description 通过 ScheduledTaskService.createDelayInstance 创建延迟实例
   * 引擎会在 executeAt 到期时自动加载并执行
   */
  @Post('create-delay-task')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建延迟任务', description: '创建延迟实例，到点自动执行' })
  async createDelayTask(@Body() dto: CreateDelayTaskDto) {
    const handler = this.registry.get(dto.taskCode)
    if (!handler) {
      return { error: `任务处理器未注册: ${dto.taskCode}` }
    }
    const executeAt = new Date(Date.now() + dto.delaySeconds * 1000)
    const instance = await this.taskService.createDelayInstance(
      dto.taskCode,
      executeAt,
      dto.entityId,
      dto.payload,
    )
    return {
      message: `延迟任务已创建，将在 ${dto.delaySeconds} 秒后执行: ${dto.taskCode}`,
      instance,
      executeAt: executeAt.toISOString(),
    }
  }

  /**
   * 用例4：查看所有任务定义（从 DB 查询）
   */
  @Get('tasks')
  @ApiOperation({ summary: '查看所有任务定义', description: '从数据库查询已同步的任务定义' })
  @SkipPermission()
  async listTasks() {
    const tasks = await this.taskService.listTasks()
    return { message: `共 ${tasks.length} 个任务定义`, tasks }
  }
}

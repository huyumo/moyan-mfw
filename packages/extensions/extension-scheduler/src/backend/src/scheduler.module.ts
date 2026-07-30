/**
 * @fileoverview 定时任务调度模块
 * @description 动态模块 forRoot(options)，提供可插拔的 SPI 配置
 */

import { Module, DynamicModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RouterModule } from '@nestjs/core'
import { ScheduledTaskDefinition, ScheduledTaskInstance, ScheduledTaskLog } from './entities'
import {
  SCHEDULER_TASK_STORAGE,
  SCHEDULER_DISTRIBUTED_LOCK,
  SCHEDULER_TASK_DISPATCHER,
  SCHEDULER_RUNTIME_NOTIFY,
  type SchedulerModuleOptions,
} from './spi/interfaces'
import { TypeOrmStorage, DbLock, EventEmitterDispatcher, PollingNotify } from './spi/impl'
import {
  SchedulerEngineService,
  TaskPreloaderService,
  BatchArchiverService,
  ScheduledTaskService,
  TaskRegistry,
} from './services'
import { MinuteWheel, SecondWheel, ArchiveWheel } from './wheel'
import { AsyncTaskPool, ResultBufferPool } from './pool'
import { ScheduledTaskController } from './controller/scheduled-task.controller'

@Module({})
export class SchedulerModule {
  static forRoot(options?: SchedulerModuleOptions): DynamicModule {
    const longPoolMax = options?.longPoolMax ?? 10
    const shortPoolMax = options?.shortPoolMax ?? 30

    return {
      module: SchedulerModule,
      imports: [
        TypeOrmModule.forFeature([
          ScheduledTaskDefinition,
          ScheduledTaskInstance,
          ScheduledTaskLog,
        ]),
        RouterModule.register([{ path: 'ext/scheduler', module: SchedulerModule }]),
      ],
      controllers: [ScheduledTaskController],
      providers: [
        // SPI 绑定（可被 options 替换）
        { provide: SCHEDULER_TASK_STORAGE, useClass: options?.storageImpl ?? TypeOrmStorage },
        { provide: SCHEDULER_DISTRIBUTED_LOCK, useClass: options?.lockImpl ?? DbLock },
        { provide: SCHEDULER_TASK_DISPATCHER, useClass: options?.dispatcherImpl ?? EventEmitterDispatcher },
        { provide: SCHEDULER_RUNTIME_NOTIFY, useClass: options?.notifyImpl ?? PollingNotify },
        // 核心服务
        SchedulerEngineService,
        TaskPreloaderService,
        BatchArchiverService,
        ScheduledTaskService,
        TaskRegistry,
        // 时间轮
        MinuteWheel,
        SecondWheel,
        ArchiveWheel,
        // 池
        {
          provide: AsyncTaskPool,
          useFactory: () => new AsyncTaskPool(longPoolMax, shortPoolMax),
        },
        ResultBufferPool,
        // 传递模块配置给需要的服务
        {
          provide: 'SCHEDULER_OPTIONS',
          useValue: options ?? {},
        },
      ],
      exports: [ScheduledTaskService, TaskRegistry],
    }
  }
}

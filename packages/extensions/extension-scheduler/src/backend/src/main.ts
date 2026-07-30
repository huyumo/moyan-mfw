/**
 * @fileoverview 定时任务扩展包独立后端入口（开发用）
 * @description 用于独立运行扩展包进行开发测试
 */

import { createExtensionBackendApp } from 'moyan-mfw-base/backend'
import { SchedulerModule } from './scheduler.module'

async function bootstrap() {
  const app = await createExtensionBackendApp({
    name: 'scheduler',
    module: SchedulerModule,
    entities: [],
  })
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001)
}

bootstrap()

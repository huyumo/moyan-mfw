/**
 * @fileoverview 定时任务扩展包独立前端入口（开发用）
 * @description 用于独立运行扩展包进行开发测试
 */

import { createExtensionFrontendApp } from 'moyan-mfw-base/frontend'
import type { FrontendAppTypeMenuConfig } from 'moyan-mfw-base/frontend'
import { MfwScheduledTaskPage } from './index'

const menuTrees: FrontendAppTypeMenuConfig[] = [
  {
    appTypeCode: 'scheduler',
    label: '定时任务管理',
    icon: 'Clock',
    children: [
      {
        path: 'scheduled-task',
        name: '定时任务管理',
        icon: 'Clock',
        permissions: ['编辑', '执行'],
        component: MfwScheduledTaskPage,
      },
    ],
  },
]

const app = createExtensionFrontendApp({
  name: '定时任务管理',
  menuTrees,
})

app.mount('#app')

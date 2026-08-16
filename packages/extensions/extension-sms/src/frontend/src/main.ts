/**
 * @fileoverview 短信扩展包前端自启动入口
 * @description 独立运行扩展包前端，不依赖业务层
 */
import 'moyan-mfw-base/frontend/styles/base-admin.scss'
import { createExtensionFrontendApp, type FrontendAppTypeMenuConfig } from 'moyan-mfw-base/frontend'
import { MfwSmsConfigPage } from './index'

const menuTrees: FrontendAppTypeMenuConfig[] = [
  {
    appTypeCode: 'sms',
    label: '短信管理',
    icon: 'Message',
    children: [
      {
        path: 'config',
        name: '短信配置',
        icon: 'Setting',
        component: MfwSmsConfigPage,
        permissions: ['编辑'],
      },
    ],
  },
]

const app = createExtensionFrontendApp({
  name: '短信管理',
  menuTrees,
})

app.mount('#app')

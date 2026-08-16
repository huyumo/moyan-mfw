/**
 * @fileoverview 扫码扩展包前端自启动入口
 * @description 独立运行扩展包前端，不依赖业务层
 */
import 'moyan-mfw-base/frontend/styles/base-admin.scss'
import { createExtensionFrontendApp, type FrontendAppTypeMenuConfig } from 'moyan-mfw-base/frontend'
import { MfwScanCodeConfigPage } from './index'

const menuTrees: FrontendAppTypeMenuConfig[] = [
  {
    appTypeCode: 'scan-code',
    label: '扫码管理',
    icon: 'FullScreen',
    children: [
      {
        path: 'config',
        name: '扫码配置',
        icon: 'Setting',
        component: MfwScanCodeConfigPage,
        permissions: ['编辑'],
      },
    ],
  },
]

const app = createExtensionFrontendApp({
  name: '扫码管理',
  menuTrees,
})

app.mount('#app')

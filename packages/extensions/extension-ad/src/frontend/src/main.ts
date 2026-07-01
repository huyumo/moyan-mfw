/**
 * @fileoverview 广告扩展包前端自启动入口
 * @description 独立运行扩展包前端，不依赖业务层
 */
import 'moyan-mfw-base/frontend/styles/base-admin.scss'
import { createExtensionFrontendApp, type FrontendAppTypeMenuConfig } from 'moyan-mfw-base/frontend'
import { AdPlacementList } from './index'

const menuTrees: FrontendAppTypeMenuConfig[] = [
  {
    appTypeCode: 'ad',
    label: '广告管理',
    icon: 'Notification',
    order: 1,
    children: [
      {
        path: 'placement',
        name: '广告位管理',
        icon: 'CollectionTag',
        order: 1,
        component: AdPlacementList,
        permissions: ['添加', '编辑', '删除'],
      },
    ],
  },
]

const app = createExtensionFrontendApp({
  name: '广告管理',
  menuTrees,
})

app.mount('#app')

/**
 * @fileoverview 广告扩展包前端自启动入口
 * @description 独立运行扩展包前端，不依赖业务层
 */
import 'moyan-base/frontend/styles/base-admin.scss'
import { createExtensionFrontendApp } from 'moyan-mfw-base/frontend'
import { adRoutes } from './index'

const app = createExtensionFrontendApp({
  name: '广告管理',
  routes: adRoutes,
})

app.mount('#app')

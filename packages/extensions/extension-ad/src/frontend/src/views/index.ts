/**
 * @fileoverview 广告管理模块配置
 * @description 树形菜单分组，children 承载子页面配置
 */

import { defineModuleConfig } from 'moyan-mfw-base/frontend'
import type { PageConfig } from 'moyan-mfw-base/frontend'
import placementPage from './placement/index'

const config = defineModuleConfig({
  type: 'module',
  name: '广告管理',
  icon: 'Notification',
  order: 60,
})

export default { ...config, children: [placementPage] as PageConfig<string>[] }

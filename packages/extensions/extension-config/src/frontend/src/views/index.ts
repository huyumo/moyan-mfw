/**
 * @fileoverview 配置管理模块配置
 * @description 树形菜单分组，当前无子页面，保留扩展结构
 */

import { defineModuleConfig } from 'moyan-mfw-base/frontend'

const config = defineModuleConfig({
  type: 'module',
  name: '配置管理',
  icon: 'Setting',
  order: 70,
})

export default { ...config, children: [] }
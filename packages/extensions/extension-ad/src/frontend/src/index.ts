/**
 * @fileoverview 广告扩展包前端入口
 * @description 从模块配置树手动构建路由，不使用 import.meta.glob 扫描
 */
import { buildRoutesFromModuleTree } from 'moyan-mfw-base/frontend'
import adModuleConfig from './views/index'

export const adRoutes = buildRoutesFromModuleTree(adModuleConfig, 'ad', {
  namespaceName: '广告管理',
})

/**
 * @fileoverview 广告扩展包前端入口
 * @description 扫描自身 views 目录构建路由数组。按页面拆分导出，支持业务层选择性引入。
 */
import { buildRoutesFromConfigs } from 'moyan-mfw-base/frontend'

const allConfigs = import.meta.glob('./views/**/index.{ts,tsx}', {
  eager: true,
  import: 'default',
})

const allRoutes = buildRoutesFromConfigs(allConfigs, { minSegments: 1 })

export const adTypeRoutes = allRoutes.filter(r => r.path?.startsWith('type'))
export const adPlacementRoutes = allRoutes.filter(r => r.path?.startsWith('placement'))
export const adContentRoutes = allRoutes.filter(r => r.path?.startsWith('content'))

export const adRoutes = allRoutes

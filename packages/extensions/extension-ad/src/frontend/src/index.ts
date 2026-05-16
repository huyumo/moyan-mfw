/**
 * @fileoverview 广告扩展包前端入口
 * @description 扫描自身 views 目录构建路由数组。按页面拆分导出，支持业务层选择性引入。
 */
import { buildRoutesFromConfigs } from 'moyan-mfw-base/frontend'

const allConfigs = import.meta.glob('./views/**/index.{ts,tsx}', {
  eager: true,
  import: 'default',
})

const allRoutes = buildRoutesFromConfigs(allConfigs, {
  minSegments: 1,
  routePrefix:'/ext/ad',
})

console.log(allRoutes);


export const adRoutes = allRoutes

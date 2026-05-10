/**
 * @fileoverview 广告扩展包前端入口
 * @description 扫描自身 views 目录构建路由数组，供消费方通过 extraRoutes 注入
 */

import { buildRoutesFromConfigs } from 'moyan-mfw-base-frontend'

const allConfigs = import.meta.glob('./views/**/index.{ts,tsx}', {
  eager: true,
  import: 'default',
})

export const adRoutes = buildRoutesFromConfigs(allConfigs, { minSegments: 1 })

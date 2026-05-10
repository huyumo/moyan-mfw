/**
 * @fileoverview 扩展包前端启动入口
 * @description 为扩展包提供统一的前端启动逻辑，复用 createBaseAdminApp 引擎
 */
import { createBaseAdminApp, type BaseAdminBootstrapOptions } from './create-base-admin-app'
import type { LayoutStyleConfig, AdminNavigationConfig } from './types/layout-types'

export interface CreateExtensionFrontendAppOptions {
  name: string
  routes: BaseAdminBootstrapOptions['routes']
  layout?: Partial<LayoutStyleConfig>
  port?: number
}

export function createExtensionFrontendApp(options: CreateExtensionFrontendAppOptions) {
  const navigation: Partial<AdminNavigationConfig> = {
    brandName: options.name,
    homePath: options.routes?.[0]?.path
      ? `/${String(options.routes[0].path).replace(/^ext\/\w+\//, '')}`
      : '/',
  }

  return createBaseAdminApp({
    title: options.name,
    routes: options.routes,
    layout: {
      layoutMode: 'dual',
      showTabs: true,
      ...options.layout,
    },
    navigation,
  })
}

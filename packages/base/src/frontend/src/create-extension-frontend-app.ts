/**
 * @fileoverview 扩展包前端启动入口
 * @description 为扩展包提供统一的前端启动逻辑，复用 createBaseAdminApp 引擎
 */
import { createBaseAdminApp, type BaseAdminBootstrapOptions } from './create-base-admin-app'
import type { FrontendAppTypeMenuConfig } from './router/routes'
import type { LayoutStyleConfig, AdminNavigationConfig } from './types/layout-types'

export interface CreateExtensionFrontendAppOptions {
  name: string
  /** 扩展包菜单树（组件内联在节点上） */
  menuTrees: FrontendAppTypeMenuConfig[]
  layout?: Partial<LayoutStyleConfig>
  port?: number
}

export function createExtensionFrontendApp(options: CreateExtensionFrontendAppOptions) {
  const firstPath = options.menuTrees[0]?.children?.[0]?.path
    ? `/${options.menuTrees[0].children[0].path}`
    : '/'

  const navigation: Partial<AdminNavigationConfig> = {
    brandName: options.name,
    homePath: firstPath,
  }

  return createBaseAdminApp({
    title: options.name,
    menuTrees: options.menuTrees,
    layout: {
      layoutMode: 'dual',
      showTabs: true,
      ...options.layout,
    },
    navigation,
  })
}

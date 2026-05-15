/**
 * @fileoverview 基础前端后台应用创建入口。
 */

import { createPinia, type Pinia } from 'pinia';
import { createApp, type App, type ComponentPublicInstance } from 'vue';
import type { Router } from 'vue-router';
import type {
  AdminNavigationConfig,
  LayoutExtensionComponents,
  LoginExtensionComponents,
  LayoutStyleConfig,
} from './types/layout-types';
import BaseAdminRoot from './layouts/components/base/BaseAdminRoot.vue';
import { createBaseAdminRouter, type CreateBaseAdminRouterOptions, buildBasePackageRoutes } from './router';
import { createMenuTreeFromRoutes, dedupeMenuTree } from './router/menu-tree';
import { useLayoutStore } from './store/layout-store';
import { setupPlugins } from './plugins';
import { initPermissionCache as initPermissionValueCache } from './utils/permissions';
import { ApiPermissionValuesGetPermissionValues } from './apis/sys';

/**
 * 管理后台启动选项。
 */
export interface BaseAdminBootstrapOptions extends CreateBaseAdminRouterOptions {
  /** 外部注入的状态实例 */
  pinia?: Pinia;
  /** 布局配置 */
  layout?: Partial<LayoutStyleConfig>;
  /** 导航配置 */
  navigation?: Partial<AdminNavigationConfig>;
  /** 布局扩展组件 */
  layoutExtensions?: LayoutExtensionComponents;
  /** 登录页扩展组件 */
  loginExtensions?: LoginExtensionComponents;
}

/**
 * 创建参数别名。
 */
export type CreateBaseAdminAppOptions = BaseAdminBootstrapOptions;

/**
 * 管理后台应用实例。
 */
export interface BaseAdminAppInstance {
  /** Vue 应用 */
  app: App;
  /** 路由实例 */
  router: Router;
  /** 状态实例 */
  pinia: Pinia;
  /** 挂载函数 */
  mount: (selector?: string | Element) => Promise<ComponentPublicInstance>;
  /** 从后端获取权限值标签映射表 */
  fetchPermissionValues: () => Promise<Array<{ name: string; bitValue: string }>>;
  /** 初始化权限值运行时缓存 */
  initPermissionCache: (values: Array<{ name: string; bitValue: string }>) => void;
}

/**
 * 创建后台应用并完成路由、状态与导航初始化。
 */
export function createBaseAdminApp(options: BaseAdminBootstrapOptions = {}): BaseAdminAppInstance {
  const app = createApp(BaseAdminRoot);
  const pinia = options.pinia ?? createPinia();
  const router = createBaseAdminRouter(options);

  // 安装插件（Element Plus + moyan-api 适配器）
  setupPlugins(app);

  app.use(pinia);
  app.use(router);

  const layoutStore = useLayoutStore(pinia);

  layoutStore.setLayoutExtensions(options.layoutExtensions);
  layoutStore.setLoginExtensions(options.loginExtensions);

  if (options.layout) {
    const layoutConfig = { ...options.layout };
    delete layoutConfig.colorMode;
    delete layoutConfig.themePackage;
    layoutStore.patchStyleConfig(layoutConfig);
  }

  // 合并基包路由和业务路由生成菜单树
  const basePackageRoutes = buildBasePackageRoutes();
  const allRoutes = [...basePackageRoutes, ...(options.routes || [])];
  const businessMenuTree = createMenuTreeFromRoutes(allRoutes, { parentPath: '/' });
  const resolvedNavigation: Partial<AdminNavigationConfig> = {
    ...options.navigation,
  };

  if (!options.navigation?.sideMenu) {
    resolvedNavigation.sideMenu = dedupeMenuTree([...layoutStore.navigation.sideMenu, ...businessMenuTree]);
  }

  if (
    resolvedNavigation.topNav ||
    resolvedNavigation.sideMenu ||
    resolvedNavigation.brandName ||
    resolvedNavigation.brandTagline ||
    resolvedNavigation.homePath
  ) {
    layoutStore.setNavigation(resolvedNavigation);
  }

  layoutStore.syncActiveTopMenuByPath(router.currentRoute.value.path);

  return {
    app,
    router,
    pinia,
    mount: async (selector: string | Element = '#app') => {
      await router.isReady();
      return app.mount(selector);
    },
    async fetchPermissionValues() {
      const result = await new ApiPermissionValuesGetPermissionValues({});
      return (result as Array<{ name: string; bitPosition: number; bitValue: string }>).map((item) => ({
        name: item.name,
        bitValue: item.bitValue,
      }));
    },
    initPermissionCache(values: Array<{ name: string; bitValue: string }>) {
      initPermissionValueCache(values);
    },
  };
}

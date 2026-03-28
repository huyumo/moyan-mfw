/**
 * @fileoverview 基础前端后台应用创建入口。
 */

import 'element-plus/dist/index.css';
import './styles/base-admin.scss';

import ElementPlus from 'element-plus';
import { createPinia, type Pinia } from 'pinia';
import { createApp, type App, type ComponentPublicInstance } from 'vue';
import type { RouteRecordRaw, Router } from 'vue-router';
import { defaultThemeKey } from './config/layout-defaults';
import type {
  AdminNavigationConfig,
  LayoutExtensionComponents,
  LoginExtensionComponents,
  LayoutStyleConfig,
  ThemeRegistry,
} from './types/layout-types';
import BaseAdminRoot from './layouts/components/base/BaseAdminRoot.vue';
import { createBaseAdminRouter, type CreateBaseAdminRouterOptions } from './router';
import { createMenuTreeFromRoutes, dedupeMenuTree } from './router/menu-tree';
import { useLayoutStore } from './store/layout-store';

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
  /** 主题注册表 */
  themes?: ThemeRegistry;
  /** 默认主题键 */
  defaultTheme?: string;
  /** 是否启用主题切换 */
  enableThemeSwitch?: boolean;
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
}

/**
 * 创建后台应用并完成路由、状态与导航初始化。
 */
export function createBaseAdminApp(options: BaseAdminBootstrapOptions = {}): BaseAdminAppInstance {
  const app = createApp(BaseAdminRoot);
  const pinia = options.pinia ?? createPinia();
  const router = createBaseAdminRouter(options);

  app.use(pinia);
  app.use(router);
  app.use(ElementPlus);

  const layoutStore = useLayoutStore(pinia);

  if (options.themes) {
    layoutStore.registerThemes(options.themes);
  }

  layoutStore.setThemeSwitchEnabled(options.enableThemeSwitch ?? true);
  layoutStore.setTheme(options.defaultTheme ?? defaultThemeKey);
  layoutStore.setLayoutExtensions(options.layoutExtensions);
  layoutStore.setLoginExtensions(options.loginExtensions);

  if (options.layout) {
    layoutStore.patchStyleConfig(options.layout);
  }

  const businessMenuTree = createMenuTreeFromRoutes(options.businessRoutes || [], { parentPath: '/' });
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
  };
}

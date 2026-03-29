/**
 * @fileoverview 路由配置 - 自动扫描模式。
 *
 * 路由页面加载规则：
 * 1. 页面组件必须存放在 src/views/ 目录下
 * 2. 每个页面是一个独立目录，目录内必须包含 index.ts 或 index.tsx 配置文件
 * 3. 配置文件必须导出：page 组件、path 路径、name 名称
 * 4. 如果找不到配置文件，则自动显示 404 页面
 *
 * 配置文件示例 (index.ts):
 * ```typescript
 * import Dashboard from './dashboard.vue';
 * export default { page: Dashboard, path: 'dashboard', name: '看板', icon: 'DataBoard', auth: true };
 * ```
 */

import type { RouteRecordRaw } from 'vue-router';

/**
 * 模块配置接口（用于菜单分组）
 */
export interface ModuleConfig {
  /** 类型：module 表示模块分组 */
  type?: 'module';
  /** 模块/菜单名称 */
  name: string;
  /** 菜单图标 */
  icon?: string;
  /** 菜单顺序 */
  order?: number;
}

/**
 * 页面配置接口
 */
export interface PageConfig {
  /** 页面组件 */
  page: unknown;
  /** 路由路径 */
  path: string;
  /** 页面/菜单名称 */
  name: string;
  /** 菜单图标 */
  icon?: string;
  /** 是否需要认证 */
  auth?: boolean;
  /** 菜单顺序 */
  order?: number;
  /** 菜单隐藏 */
  hidden?: boolean;
  /** 子页面配置 */
  children?: PageConfig[];
}

/**
 * 动态导入布局组件
 */
const AdminLayout = () => import('../layouts/AdminLayout.vue');

/**
 * 403 和 404 页面
 */
const ForbiddenPage = () => import('../views/forbidden/Index.vue');
const NotFoundPage = () => import('../views/not-found/Index.vue');

/**
 * 自动扫描 views 目录下所有 index.ts / index.tsx 配置文件（包括模块配置和页面配置）
 * 使用 eager: true 直接读取配置内容
 */
const allConfigs = import.meta.glob('../views/**/index.{ts,tsx}', {
  eager: true,
  import: 'default',
});

/**
 * 判断是否为模块配置
 */
function isModuleConfig(config: unknown): config is ModuleConfig {
  return typeof config === 'object' && config !== null && (config as ModuleConfig).type === 'module';
}

/**
 * 判断是否为页面配置
 */
function isPageConfig(config: unknown): config is PageConfig {
  return typeof config === 'object' && config !== null && 'page' in config && 'path' in config && 'name' in config;
}

/**
 * 从扫描结果构建路由配置
 */
function buildRoutesFromConfigs(): RouteRecordRaw[] {
  // 1. 分离模块配置和页面配置
  const moduleMap = new Map<string, ModuleConfig>();
  const pageConfigs = new Map<string, PageConfig>();

  for (const [path, config] of Object.entries(allConfigs)) {
    // 跳过 404 和 forbidden 页面（它们有特殊处理）
    if (path.includes('/not-found/') || path.includes('/forbidden/')) {
      continue;
    }

    // 从路径提取相对路径
    const relativePath = path
      .replace('../views/', '')
      .replace('/index.ts', '')
      .replace('/index.tsx', '');

    if (isModuleConfig(config)) {
      // 模块配置存储在模块目录（如 business/index.ts）
      moduleMap.set(relativePath, config);
    } else if (isPageConfig(config)) {
      // 页面配置存储在页面目录（如 business/orders/index.ts）
      // 跳过只有 1 层的路径（如 business/index.ts 不是页面配置）
      const segments = relativePath.split('/');
      if (segments.length >= 2) {
        pageConfigs.set(relativePath, config);
      }
    }
  }

  // 2. 按层级组织路由
  const routeMap = new Map<string, RouteRecordRaw>();

  for (const [relativePath, config] of pageConfigs.entries()) {
    const segments = relativePath.split('/').filter(Boolean);
    // 子路由路径使用相对路径（只取最后一段）
    // 例如：'business/orders' -> 'orders'
    const path = segments[segments.length - 1] || '';

    // 创建路由
    const route: RouteRecordRaw = {
      path: path,
      name: `Route_${segments.join('_')}` || 'Root',
      component: config.page as RouteRecordRaw['component'],
      meta: {
        title: config.name,
        menuLabel: config.name,
        menuIcon: config.icon,
        menuOrder: config.order ?? 50,
        requiresAuth: config.auth ?? true,
        hidden: config.hidden,
      },
    } as RouteRecordRaw;

    routeMap.set('/' + relativePath, route);
  }

  // 3. 为有页面配置的模块创建模块路由（作为菜单分组）
  for (const [modulePath, moduleConfig] of moduleMap.entries()) {
    // 检查该模块下是否有页面
    const hasChildRoutes = Array.from(routeMap.keys()).some(key =>
      key.startsWith('/' + modulePath + '/')
    );

    if (hasChildRoutes) {
      // 创建模块分组路由（使用空布局组件，用于渲染子路由）
      const route: RouteRecordRaw = {
        path: modulePath,
        name: `Module_${modulePath}`,
        component: () => import('../layouts/EmptyLayout.vue'),
        redirect: () => {
          // 找到该模块下的第一个子路由并跳转
          const firstChildRoute = Array.from(routeMap.entries())
            .find(([key]) => key.startsWith('/' + modulePath + '/'));
          if (firstChildRoute) {
            // 返回命名路由对象
            const childRoute = firstChildRoute[1];
            return {
              name: childRoute.name,
            };
          }
          return { path: '/404' };
        },
        meta: {
          title: moduleConfig.name,
          menuLabel: moduleConfig.name,
          menuIcon: moduleConfig.icon,
          menuOrder: moduleConfig.order ?? 50,
          menu: true,
        },
      } as unknown as RouteRecordRaw;
      routeMap.set('/' + modulePath, route);
    }
  }

  // 4. 构建树形结构（按路径深度排序，确保先处理父路由）
  const rootRoutes: RouteRecordRaw[] = [];
  const sortedRoutes = Array.from(routeMap.entries())
    .sort(([a], [b]) => a.split('/').length - b.split('/').length);

  for (const [fullPath, route] of sortedRoutes) {
    const parentPath = fullPath.substring(0, fullPath.lastIndexOf('/'));

    if (!parentPath || parentPath === '/') {
      // 根级路由
      rootRoutes.push(route);
    } else {
      // 子路由，找到父路由并添加
      const parentRoute = routeMap.get(parentPath);
      if (parentRoute) {
        if (!parentRoute.children) {
          parentRoute.children = [];
        }
        parentRoute.children.push(route);

        // 如果父路由没有 component，设置为 redirect
        if (!parentRoute.component && !parentRoute.redirect) {
          parentRoute.redirect = fullPath;
        }
      } else {
        rootRoutes.push(route);
      }
    }
  }

  return rootRoutes;
}

/**
 * 创建基础管理后台路由的选项接口。
 */
export interface CreateBaseAdminRoutesOptions {
  /** 额外路由配置（可选） */
  extraRoutes?: RouteRecordRaw[];
}

/**
 * 创建基础管理后台路由配置。
 */
export function createBaseAdminRoutes(
  options: CreateBaseAdminRoutesOptions = {}
): RouteRecordRaw[] {
  // 自动扫描生成的路由
  const autoRoutes = buildRoutesFromConfigs();

  // 合并额外路由
  const allRoutes = options.extraRoutes
    ? [...autoRoutes, ...options.extraRoutes]
    : autoRoutes;

  const baseChildren: RouteRecordRaw[] = [
    {
      path: '',
      redirect: '/dashboard',
    },
    // 注入自动扫描的路由
    ...allRoutes,
  ];

  return [
    {
      path: '/login',
      name: 'AdminLogin',
      component: () => import('../views/login/Index.vue'),
      meta: {
        title: '登录',
        menu: false,
      },
    },
    {
      path: '/',
      component: AdminLayout,
      meta: {
        requiresAuth: true,
        menu: false,
      },
      children: baseChildren,
    },
    {
      path: '/403',
      name: 'AdminForbidden',
      component: ForbiddenPage,
      meta: {
        title: '权限不足',
        requiresAuth: true,
        menu: false,
      },
    },
    {
      path: '/404',
      name: 'AdminNotFound',
      component: NotFoundPage,
      meta: {
        title: '页面不存在',
        menu: false,
      },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/404',
    },
  ];
}

/**
 * 默认的基础管理后台路由配置。
 */
export const baseAdminRoutes: RouteRecordRaw[] = createBaseAdminRoutes();

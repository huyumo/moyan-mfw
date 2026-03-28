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
 * 自动扫描 views 目录下所有 index.ts / index.tsx 配置文件
 * 使用 eager: true 直接读取配置内容
 */
const pageConfigs = import.meta.glob(
  '../views/**/index.{ts,tsx}',
  { eager: true, import: 'default' }
);

/**
 * 将扫描结果转换为路由配置
 */
function buildRoutesFromConfigs(): RouteRecordRaw[] {
  const configMap = new Map<string, PageConfig>();

  // 1. 收集所有配置
  for (const [path, config] of Object.entries(pageConfigs)) {
    // 跳过 404 和 forbidden 页面（它们有特殊处理）

    // console.log('path:', path,config);

    if (path.includes('/not-found/') || path.includes('/forbidden/')) {
      continue;
    }

    // 从路径提取相对路径
    const relativePath = path
      .replace('../views/', '')
      .replace('/index.ts', '')
      .replace('/index.tsx', '');

    configMap.set(relativePath, config as PageConfig);
  }
  console.log('configMap:', configMap);

  // 2. 按层级组织路由
  const routeMap = new Map<string, RouteRecordRaw>();

  for (const [relativePath, config] of configMap.entries()) {
    const segments = relativePath.split('/').filter(Boolean);
    const fullPath = '/' + segments.join('/');

    // 创建路由
    const route: RouteRecordRaw = {
      path: segments[segments.length - 1] || '',
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

    routeMap.set(fullPath, route);
  }

  // 3. 构建树形结构
  const rootRoutes: RouteRecordRaw[] = [];

  for (const [fullPath, route] of routeMap.entries()) {
    const parentPath = fullPath.substring(0, fullPath.lastIndexOf('/'));

    if (!parentPath) {
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

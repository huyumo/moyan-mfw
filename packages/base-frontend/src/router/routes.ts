/**
 * @fileoverview 路由配置工具。
 *
 * 路由页面加载规则：
 * 1. 页面组件必须存放在 src/views/ 目录下
 * 2. 每个页面是一个独立目录，目录内必须包含以下文件之一：
 *    - Index.vue (优先)
 *    - index.ts
 *    - index.tsx
 * 3. 如果路由配置了某个页面，但对应目录下没有找到上述文件，则自动显示 404 页面
 */

import type { RouteRecordRaw } from 'vue-router';

/**
 * 自动加载 views 目录下所有页面组件
 */
const viewModules = import.meta.glob(
  '../views/**/Index.{vue,ts,tsx}',
  { eager: false }
);

/**
 * 404 页面路径
 */
const NOT_FOUND_PATH = '../views/not-found/Index.vue';

/**
 * 动态导入布局组件
 */
const AdminLayout = () => import('../layouts/AdminLayout.vue');

/**
 * 403 和 404 页面（直接静态导入）
 */
const ForbiddenPage = () => import('../views/forbidden/Index.vue');
const NotFoundPage = () => import(NOT_FOUND_PATH);

/**
 * 业务菜单项接口 - 业务方只需要定义这个简单结构
 */
export interface BusinessMenuItem {
  /** 路由名称/标识 */
  name: string;
  /** 页面标题 */
  title: string;
  /** 菜单图标 */
  icon?: string;
  /** 子菜单 */
  children?: BusinessMenuItem[];
  /** 路由路径（可选，不传则用 name 生成） */
  path?: string;
}

/**
 * 获取页面组件的加载函数
 * @param dirName - views 下的目录路径（如 '/dashboard', '/system/authority/node'）
 * @returns 组件加载函数，找不到则返回 404 页面
 */
function getViewComponent(dirName: string) {
  const basePath = `../views${dirName}/`;

  // 按优先级查找：Index.vue > index.ts > index.tsx
  const componentPath1 = `${basePath}Index.vue`;
  const componentPath2 = `${basePath}index.ts`;
  const componentPath3 = `${basePath}index.tsx`;

  if (viewModules[componentPath1]) {
    return viewModules[componentPath1];
  }
  if (viewModules[componentPath2]) {
    return viewModules[componentPath2];
  }
  if (viewModules[componentPath3]) {
    return viewModules[componentPath3];
  }

  // 找不到文件，返回 404 页面
  return () => import(NOT_FOUND_PATH);
}

/**
 * 将路径转换为驼峰命名
 * @param path - 路径字符串
 * @returns 驼峰命名字符串
 */
function pathToCamelCase(path: string): string {
  return path
    .replace(/^\//, '')
    .split('/')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * 将业务菜单树转换为路由配置
 * @param menuTree - 业务菜单树
 * @param parentPath - 父级路径前缀
 * @returns 路由配置数组
 */
export function menuTreeToRoutes(
  menuTree: BusinessMenuItem[],
  parentPath: string = ''
): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = [];

  for (const item of menuTree) {
    // 生成路径：如果有 path 则使用，否则用 name 生成
    const path = item.path || `/${item.name}`;
    const fullPath = parentPath + path;

    // 判断是否有子菜单
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      // 有子菜单：递归处理子节点
      const children = menuTreeToRoutes(
        item.children as BusinessMenuItem[],
        `${fullPath}/`
      );

      // 获取第一个子节点的路径用于 redirect
      const firstChildPath = children[0]?.path || '';

      const route: RouteRecordRaw = {
        path: item.name,
        name: `Route${pathToCamelCase(fullPath)}`,
        redirect: `${item.name}/${firstChildPath}`,
        children,
        meta: {
          title: item.title,
          menuLabel: item.title,
          menuIcon: item.icon,
          requiresAuth: true,
        },
      };
      routes.push(route);
    } else {
      // 叶子节点：加载对应页面组件
      const route: RouteRecordRaw = {
        path: fullPath.replace(/^\//, ''),
        name: `Route${pathToCamelCase(fullPath)}`,
        component: getViewComponent(fullPath),
        meta: {
          title: item.title,
          menuLabel: item.title,
          menuIcon: item.icon,
          requiresAuth: true,
        },
      };
      routes.push(route);
    }
  }

  return routes;
}

/**
 * 创建基础管理后台路由的选项接口。
 */
export interface CreateBaseAdminRoutesOptions {
  /** 业务菜单树配置 */
  menus?: BusinessMenuItem[];
}

/**
 * 创建基础管理后台路由配置。
 * @param options 路由配置选项。
 * @returns 路由配置数组。
 */
export function createBaseAdminRoutes(options: CreateBaseAdminRoutesOptions = {}): RouteRecordRaw[] {
  // 将业务菜单树转换为路由
  const businessRoutes = options.menus
    ? menuTreeToRoutes(options.menus)
    : [];

  const baseChildren: RouteRecordRaw[] = [
    {
      path: '',
      redirect: '/dashboard',
    },
    {
      path: 'dashboard',
      name: 'AdminDashboard',
      component: getViewComponent('/dashboard'),
      meta: {
        title: '首页',
        menuLabel: '首页',
        menuIcon: 'DataBoard',
        menuOrder: 1,
        affix: true,
      },
    },
    // 注入业务路由
    ...businessRoutes,
  ];

  return [
    {
      path: '/login',
      name: 'AdminLogin',
      component: getViewComponent('/login'),
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

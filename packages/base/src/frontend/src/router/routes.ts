/**
 * @fileoverview 路由构建工具模块。
 *
 * 基于手动菜单树配置生成 Vue Router 路由，替代原有的 import.meta.glob 自动扫描方案。
 *
 * 核心设计：
 * - MenuNode：纯数据菜单节点（前后端共享）
 * - ComponentMap：路径 → Vue 组件映射（仅前端使用）
 * - 有 children 的节点 = MENU 分组（生成重定向路由）
 * - 无 children 的节点 = PAGE 页面（生成实际路由）
 */

import type { RouteRecordRaw } from "vue-router";
import {
  registerPermissionValues,
  type PermissionName,
} from "../utils/permissions";
import type { AppTypeMenuConfig, MenuNode } from "@internal/base-shared";

export {
  registerPermissionValues,
  createBusinessPageConfigFn,
} from "../utils/permissions";

// ==================== 类型定义 ====================

/**
 * 组件映射表类型：路径 → Vue 组件（支持同步组件和懒加载函数）。
 */
export type ComponentMap = Record<string, unknown | (() => Promise<unknown>)>;

/**
 * 从嵌套对象构建扁平化的组件映射表。
 *
 * 支持与菜单树结构一致的嵌套写法，自动拼接路径并扁平化，
 * 避免手动拼接路径字符串导致的错误。
 *
 * @example
 * ```typescript
 * const componentMap = defineComponentMap({
 *   dashboard: () => import('./views/dashboard/Index.vue'),
 *   sys: {
 *     'app-type': () => import('moyan-mfw-base/frontend').then(m => m.SysAppTypePage),
 *     user: () => import('moyan-mfw-base/frontend').then(m => m.SysUserPage),
 *   },
 *   business: {
 *     orders: () => import('./views/business/orders/Index.vue'),
 *   },
 * });
 * // 等价于 { dashboard: ..., 'sys/app-type': ..., 'sys/user': ..., 'business/orders': ... }
 * ```
 */
export function defineComponentMap<
  T extends Record<string, unknown>,
>(nested: T): ComponentMap {
  const result: ComponentMap = {};

  function walk(obj: Record<string, unknown>, prefix: string): void {
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      const path = prefix ? `${prefix}/${key}` : key;

      if (
        typeof value === "function" ||
        (typeof value === "object" &&
          value !== null &&
          "then" in (value as object))
      ) {
        // 叶子节点：组件或懒加载函数
        result[path] = value;
      } else if (typeof value === "object" && value !== null) {
        // 分支节点：递归
        walk(value as Record<string, unknown>, path);
      }
    }
  }

  walk(nested, "");
  return result;
}

/**
 * 扩展包路由构建参数。
 */
export interface ExtensionRouteOptions {
  /** 扩展包名称，如 `'ad'`、`'config'` */
  extensionName: string;
  /** 扩展包在菜单中的显示名称 */
  namespaceLabel: string;
  /** 扩展包图标 */
  namespaceIcon?: string;
  /** 菜单排序 */
  namespaceOrder?: number;
}

// ==================== 核心路由构建函数 ====================

/**
 * 从菜单树配置构建 Vue Router 路由。
 *
 * 这是新的推荐路由构建方式。
 *
 * 处理流程：
 * 1. 递归遍历所有 AppType 的菜单树节点
 * 2. 有 children 的节点 → 生成 MENU 重定向路由
 * 3. 无 children 的节点 → 从 componentMap 查找组件 → 生成 PAGE 路由
 * 4. 所有路由携带 moduleInfo（含 appTypeCode）供菜单按 AppType 分组
 *
 * @param menuTrees - 应用类型菜单树配置数组
 * @param componentMap - 路径 → Vue 组件的映射表（key 为完整路径如 `'sys/user'`）
 * @returns 扁平路由数组
 */
export function buildRoutesFromMenuTrees(
  menuTrees: AppTypeMenuConfig[],
  componentMap: ComponentMap = {},
): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = [];
  const seenPaths = new Set<string>();

  for (const appTypeConfig of menuTrees) {
    processMenuNodes(
      appTypeConfig.children,
      "",
      undefined,
      undefined,
      undefined,
      appTypeConfig,
      componentMap,
      routes,
      seenPaths,
    );
  }

  return routes;
}

/**
 * 从菜单树配置构建扩展包路由（带 `/ext/{name}/` 前缀）。
 *
 * 与旧的 `buildRoutesFromModuleTree` 对应，但使用新的 MenuNode + ComponentMap 模式。
 * 生成的路由路径会自动添加 `/ext/{extensionName}/` 前缀。
 *
 * @param menuNodes - 扩展包的菜单节点树（纯数据）
 * @param componentMap - 路径 → Vue 组件的映射表
 * @param options - 扩展包配置
 * @returns 扁平路由数组
 */
export function buildRoutesFromMenuTreeWithPrefix(
  menuNodes: MenuNode[],
  componentMap: ComponentMap,
  options: ExtensionRouteOptions,
): RouteRecordRaw[] {
  const { extensionName, namespaceLabel, namespaceIcon, namespaceOrder } =
    options;
  const extPrefix = `ext/${extensionName}`;
  const routes: RouteRecordRaw[] = [];
  const pageRoutes: RouteRecordRaw[] = [];

  const fakeAppTypeConfig = {
    appTypeCode: `_ext_${extensionName}`,
    label: namespaceLabel,
    icon: namespaceIcon,
    order: namespaceOrder ?? 50,
    children: menuNodes,
  };

  processMenuNodes(
    menuNodes,
    extPrefix,
    namespaceLabel,
    namespaceIcon,
    namespaceOrder ?? 50,
    fakeAppTypeConfig,
    componentMap,
    pageRoutes,
    new Set<string>(),
  );

  routes.push(...pageRoutes);

  // 生成命名空间重定向路由
  if (pageRoutes.length > 0) {
    const firstChild = menuNodes[0];
    const firstChildPath = firstChild.children?.length
      ? `${extPrefix}/${firstChild.path}/${firstChild.children[0].path}`
      : `${extPrefix}/${firstChild.path}`;

    routes.push({
      path: "ext",
      name: `Namespace_${extensionName}`,
      redirect: `/${firstChildPath}`,
      meta: {
        title: namespaceLabel,
        menuLabel: namespaceLabel,
        menuIcon: namespaceIcon,
        menuOrder: namespaceOrder ?? 50,
        menu: true,
        moduleInfo: {
          modulePath: "ext",
          moduleName: namespaceLabel,
          moduleIcon: namespaceIcon,
          moduleOrder: namespaceOrder ?? 50,
          appTypeCode: `_ext_${extensionName}`,
        },
      },
    } as RouteRecordRaw);
  }

  return routes;
}

// ==================== 内部递归处理 ====================

/**
 * 递归处理菜单节点，生成路由。
 */
function processMenuNodes(
  nodes: MenuNode[],
  parentPath: string,
  parentModuleName: string | undefined,
  parentModuleIcon: string | undefined,
  parentModuleOrder: number | undefined,
  appTypeConfig: AppTypeMenuConfig,
  componentMap: ComponentMap,
  routes: RouteRecordRaw[],
  seenPaths: Set<string>,
): void {
  for (const node of nodes) {
    const fullPath = parentPath ? `${parentPath}/${node.path}` : node.path;
    const hasChildren = node.children && node.children.length > 0;

    if (hasChildren) {
      // MENU 分组节点：生成重定向路由到第一个子页面
      const firstChild = node.children![0];
      const firstChildPath = `${fullPath}/${firstChild.path}`;

      if (!seenPaths.has(fullPath)) {
        seenPaths.add(fullPath);
        routes.push({
          path: fullPath,
          name: `Menu_${fullPath.replace(/\//g, "_").replace(/:/g, "_")}`,
          redirect: `/${firstChildPath}`,
          meta: {
            title: node.name,
            menuLabel: node.name,
            menuIcon: node.icon,
            menuOrder: node.order ?? 50,
            menu: true,
            moduleInfo: {
              modulePath: fullPath,
              moduleName: node.name,
              moduleIcon: node.icon,
              moduleOrder: node.order ?? 50,
              appTypeCode: appTypeConfig.appTypeCode,
            },
          },
        } as RouteRecordRaw);
      }

      processMenuNodes(
        node.children!,
        fullPath,
        node.name,
        node.icon,
        node.order ?? 50,
        appTypeConfig,
        componentMap,
        routes,
        seenPaths,
      );
    } else {
      // PAGE 页面节点
      const component = componentMap[fullPath];

      if (!component) {
        if (typeof console !== "undefined") {
          console.warn(
            `[MFW Router] 菜单节点 "${fullPath}" 在 componentMap 中未找到对应组件，跳过路由生成`,
          );
        }
        continue;
      }

      if (seenPaths.has(fullPath)) {
        continue;
      }
      seenPaths.add(fullPath);

      const routeName = `Route_${fullPath.replace(/\//g, "_").replace(/:/g, "_")}`;

      routes.push({
        path: fullPath,
        name: routeName,
        component: component as RouteRecordRaw["component"],
        meta: {
          title: node.name,
          menuLabel: node.name,
          menuIcon: node.icon,
          menuOrder: node.order ?? 50,
          requiresAuth: node.auth ?? true,
          hidden: node.hidden,
          permissions: node.permissions,
          permCode: node.permCode,
          ...(parentModuleName
            ? {
                moduleInfo: {
                  modulePath: parentPath,
                  moduleName: parentModuleName,
                  moduleIcon: parentModuleIcon,
                  moduleOrder: parentModuleOrder ?? 50,
                  appTypeCode: appTypeConfig.appTypeCode,
                },
              }
            : {}),
        },
      } as RouteRecordRaw);
    }
  }
}

// ==================== 权限值注册导出 ====================

export type { PermissionName } from "../utils/permissions";

// ==================== 类型重导出 ====================

export type { AppTypeMenuConfig, MenuNode } from "@internal/base-shared";
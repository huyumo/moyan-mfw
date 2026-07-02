/**
 * @fileoverview 路由构建工具模块。
 *
 * 基于菜单树配置（含内联组件引用）生成 Vue Router 路由。
 *
 * 核心设计：
 * - FrontendMenuNode：菜单节点 + 内联 Vue 组件（仅前端使用）
 * - 有 children 的节点 = MENU 分组（生成重定向路由）
 * - 无 children 的节点 = PAGE 页面（从 node.component 获取组件）
 */

import type { RouteRecordRaw } from "vue-router";
import type { Component } from "vue";
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
 * 前端菜单节点：在纯数据 MenuNode 基础上增加内联组件引用。
 *
 * PAGE 节点（无 children）必须提供 component 字段。
 * MENU 节点（有 children）不需要 component。
 */
export interface FrontendMenuNode extends Omit<MenuNode, "children"> {
  /** Vue 组件（同步组件或懒加载函数），仅 PAGE 节点需要 */
  component?: Component | (() => Promise<unknown>);
  /** 子节点列表 */
  children?: FrontendMenuNode[];
}

/**
 * 前端应用类型菜单树配置：children 为 FrontendMenuNode[]。
 * roleCode 对业务 AppType 必填，扩展包可省略。
 */
export interface FrontendAppTypeMenuConfig extends Omit<
  AppTypeMenuConfig,
  "children" | "roleCode"
> {
  /** 绑定的角色编码，业务 AppType 必填（如 `'super_admin'`、`'supplier_admin'`） */
  roleCode?: string;
  children: FrontendMenuNode[];
}

// ==================== 核心路由构建函数 ====================

/**
 * 从菜单树配置构建 Vue Router 路由。
 *
 * 处理流程：
 * 1. 递归遍历所有 AppType 的菜单树节点
 * 2. 有 children 的节点 → 生成 MENU 重定向路由
 * 3. 无 children 的节点 → 从 node.component 获取组件 → 生成 PAGE 路由
 * 4. 所有路由携带 moduleInfo（含 appTypeCode）供菜单按 AppType 分组
 *
 * @param menuTrees - 应用类型菜单树配置数组（含内联组件）
 * @returns 扁平路由数组
 */
export function buildRoutesFromMenuTrees(
  menuTrees: FrontendAppTypeMenuConfig[],
): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = [];
  const seenPaths = new Set<string>();

  for (const appTypeConfig of menuTrees) {
    processMenuNodes(
      appTypeConfig.children,
      appTypeConfig.appTypeCode,
      undefined,
      undefined,
      appTypeConfig,
      routes,
      seenPaths,
    );
  }

  return routes;
}

// ==================== 内部递归处理 ====================

/**
 * 递归处理菜单节点，生成路由。
 */
function processMenuNodes(
  nodes: FrontendMenuNode[],
  parentPath: string,
  parentModuleName: string | undefined,
  parentModuleIcon: string | undefined,
  appTypeConfig: FrontendAppTypeMenuConfig,
  routes: RouteRecordRaw[],
  seenPaths: Set<string>,
): void {
  for (const node of nodes) {
    // 路由路径（含 appTypeCode 前缀）
    const fullPath = parentPath ? `${parentPath}/${node.path}` : `/${appTypeConfig.appTypeCode}/${node.path}`;
    const normalizedFullPath = fullPath.replace(/\/+/g, "/").replace(/\/$/, "") || "/";

    const hasChildren = node.children && node.children.length > 0;

    if (hasChildren) {
      // MENU 分组节点：生成重定向路由到第一个子页面
      const firstChild = node.children![0];
      const firstChildPath = `${fullPath}/${firstChild.path}`;
      const normalizedFirstChildPath =
        `/${firstChildPath}`.replace(/\/+/g, "/").replace(/\/$/, "") || "/";

      if (!seenPaths.has(normalizedFullPath)) {
        seenPaths.add(normalizedFullPath);
        routes.push({
          path: normalizedFullPath,
          name: `Menu_${normalizedFullPath.replace(/\//g, "_").replace(/:/g, "_")}`,
          redirect: normalizedFirstChildPath,
          meta: {
            title: node.name,
            menuLabel: node.name,
            menuIcon: node.icon,
            menu: true,
            moduleInfo: {
              modulePath: normalizedFullPath,
              moduleName: node.name,
              moduleIcon: node.icon,
              appTypeCode: appTypeConfig.appTypeCode,
            },
          },
        } as RouteRecordRaw);
      }

      processMenuNodes(
        node.children!,
        normalizedFullPath,
        node.name,
        node.icon,
        appTypeConfig,
        routes,
        seenPaths,
      );
    } else {
      // PAGE 页面节点
      const component = node.component;

      if (!component) {
        if (typeof console !== "undefined") {
          console.warn(
            `[MFW Router] 菜单节点 "${normalizedFullPath}" 未提供 component，跳过路由生成`,
          );
        }
        continue;
      }

      if (seenPaths.has(normalizedFullPath)) {
        continue;
      }
      seenPaths.add(normalizedFullPath);

      const routeName = `Route_${normalizedFullPath.replace(/\//g, "_").replace(/:/g, "_")}`;

      routes.push({
        path: normalizedFullPath,
        name: routeName,
        component: component as RouteRecordRaw["component"],
        meta: {
          title: node.name,
          menuLabel: node.name,
          menuIcon: node.icon,
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

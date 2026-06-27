/**
 * @fileoverview 业务路由配置 - 手动组件映射方案。
 *
 * 使用 defineComponentMap 以嵌套结构定义组件映射，
 * 结构自动与 menu-trees.ts 菜单树对齐，避免路径字符串拼写错误。
 *
 * 框架内置页面从 moyan-mfw-base/frontend 按需引入。
 */

import { defineComponentMap } from "moyan-mfw-base/frontend";

export const componentMap = defineComponentMap({
  // 首页
  dashboard: () => import("./views/dashboard/Index.vue"),

  // 系统管理页面（从框架 base 包引入）
  sys: {
    "app-type": () =>
      import("moyan-mfw-base/frontend").then((m) => m.SysAppTypePage),
    app: () => import("moyan-mfw-base/frontend").then((m) => m.SysAppPage),
    user: () => import("moyan-mfw-base/frontend").then((m) => m.SysUserPage),
    role: () => import("moyan-mfw-base/frontend").then((m) => m.SysRolePage),
    member: () =>
      import("moyan-mfw-base/frontend").then((m) => m.SysMemberPage),
    permission: () =>
      import("moyan-mfw-base/frontend").then((m) => m.SysPermissionPage),
    "audit-log": () =>
      import("moyan-mfw-base/frontend").then((m) => m.SysAuditLogPage),
  },

  // 业务页面
  business: {
    orders: () => import("./views/business/orders/Index.vue"),
    reports: () => import("./views/business/reports/Index.vue"),
  },

  // 监控页面
  monitor: {
    overview: () => import("./views/monitor/overview/Index.vue"),
  },
});
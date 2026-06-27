/**
 * @fileoverview 应用类型菜单树配置
 *
 * 定义各 AppType 下的完整菜单树结构。
 * 此配置为前后端共享，前端用于生成路由，后端用于自动同步权限数据。
 *
 * 设计原则：
 * - 有 children 的节点 = MENU 分组（前端生成重定向路由）
 * - 无 children 的节点 = PAGE 页面（需在前端 componentMap 中提供组件）
 * - 子节点 path 为相对路径（相对于父 MENU 节点），自动拼接为完整路径
 * - 每个 AppType 拥有独立的菜单树，切换应用时侧边栏自动切换
 */

import type { AppTypeMenuConfig } from "moyan-mfw-base/shared";

/**
 * 系统管理（system AppType）的菜单树
 */
const systemMenuTree: AppTypeMenuConfig = {
  appTypeCode: "system",
  label: "系统管理",
  icon: "Setting",
  order: 100,
  children: [
    {
      path: "dashboard",
      name: "首页",
      icon: "DataBoard",
      order: 1,
    },
    {
      path: "sys",
      name: "系统管理",
      icon: "Setting",
      order: 100,
      children: [
        {
          path: "app-type",
          name: "应用类型管理",
          icon: "Grid",
          order: 1,
          permissions: ["编辑"],
        },
        {
          path: "app",
          name: "应用管理",
          icon: "Application",
          order: 2,
          permissions: ["添加", "编辑", "删除"],
        },
        {
          path: "user",
          name: "用户管理",
          icon: "User",
          order: 3,
          permissions: ["添加", "编辑", "删除"],
        },
        {
          path: "role",
          name: "角色管理",
          icon: "UserFilled",
          order: 4,
          permissions: ["添加", "编辑", "删除"],
        },
        {
          path: "member",
          name: "成员管理",
          icon: "Avatar",
          order: 5,
          permissions: ["添加", "编辑", "删除"],
        },
        {
          path: "permission",
          name: "权限管理",
          icon: "Lock",
          order: 6,
          permissions: ["添加", "编辑", "删除"],
        },
        {
          path: "audit-log",
          name: "审计日志",
          icon: "Document",
          order: 7,
        },
      ],
    },
  ],
};

/**
 * 供应商管理（supplier AppType）的菜单树
 */
const supplierMenuTree: AppTypeMenuConfig = {
  appTypeCode: "supplier",
  label: "供应商管理",
  icon: "Shop",
  order: 10,
  children: [
    {
      path: "dashboard",
      name: "首页",
      icon: "DataBoard",
      order: 1,
    },
    {
      path: "business",
      name: "业务中心",
      icon: "Briefcase",
      order: 10,
      children: [
        {
          path: "orders",
          name: "订单中心",
          icon: "Tickets",
          permissions: ["发货", "充值", "接待", "添加"],
        },
        {
          path: "reports",
          name: "报表中心",
          icon: "TrendCharts",
        },
      ],
    },
    {
      path: "monitor",
      name: "监控管理",
      icon: "Monitor",
      order: 20,
      children: [
        {
          path: "overview",
          name: "监控总览",
          icon: "Odometer",
        },
      ],
    },
  ],
};

/**
 * 所有应用类型的菜单树配置（导出给前端和后端使用）
 */
export const menuTrees: AppTypeMenuConfig[] = [systemMenuTree, supplierMenuTree];
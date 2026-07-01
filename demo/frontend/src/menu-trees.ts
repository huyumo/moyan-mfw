/**
 * @fileoverview 应用类型菜单树配置（前端定义，含内联组件引用）
 *
 * 定义各 AppType 下的完整菜单树结构。
 * 此配置为前端唯一数据源：既用于生成 Vue Router 路由，
 * 又通过 API 推送给后端做权限同步（序列化时剥离 component 字段）。
 *
 * 设计原则：
 * - 有 children 的节点 = MENU 分组（前端生成重定向路由）
 * - 无 children 的节点 = PAGE 页面（必须提供 component 字段）
 * - 子节点 path 为相对路径（相对于父 MENU 节点），自动拼接为完整路径
 * - 每个 AppType 拥有独立的菜单树，切换应用时侧边栏自动切换
 */

import type { FrontendAppTypeMenuConfig } from "moyan-mfw-base/frontend";
import { AdPlacementList ,} from 'moyan-mfw-extension-ad/frontend'
import { SysAppTypePage, SysAppPage, SysUserPage, SysRolePage, SysMemberPage, SysPermissionPage, SysAuditLogPage } from 'moyan-mfw-base/frontend'
import SysDashboardPage from '@/views/dashboard/Index.vue'
import SupplierDashboardPage from '@/views/dashboard/Index.vue'
import SupplierOrdersPage from '@/views/business/orders/Index.vue'
import SupplierReportsPage from '@/views/business/reports/Index.vue'
import SupplierOverviewPage from '@/views/monitor/overview/Index.vue'

/**
 * 系统管理（system AppType）的菜单树
 */
const systemMenuTree: FrontendAppTypeMenuConfig = {
  appTypeCode: "system",
  roleCode:'super_admin',
  label: "系统管理",
  icon: "Setting",
  children: [
    {
      path: "dashboard",
      name: "首页",
      icon: "DataBoard",
      component: SysDashboardPage,
    },
    {
      path: "sys",
      name: "系统管理",
      icon: "Setting",
      children: [
        {
          path: "app-type",
          name: "应用类型管理",
          icon: "Grid",
          permissions: ["编辑"],
          component: SysAppTypePage,
        },
        {
          path: "app",
          name: "应用管理",
          icon: "Application",
          permissions: ["添加", "编辑", "删除"],
          component: SysAppPage,
        },
        {
          path: "user",
          name: "用户管理",
          icon: "User",
          permissions: ["添加", "编辑", "删除"],
          component: SysUserPage,
        },
        {
          path: "role",
          name: "角色管理",
          icon: "UserFilled",
          permissions: ["添加", "编辑", "删除"],
          component: SysRolePage,
        },
        {
          path: "member",
          name: "成员管理",
          icon: "Avatar",
          permissions: ["添加", "编辑", "删除"],
          component: SysMemberPage,
        },
        {
          path: "permission",
          name: "权限管理",
          icon: "Lock",
          permissions: ["添加", "编辑", "删除"],
          component: SysPermissionPage,
        },
        {
          path: "placement",
          name: "广告位管理",
          icon: "CollectionTag",
          permCode:'xx:ext:ad:placement',
          permissions: ["添加", "编辑", "删除"],
          component: AdPlacementList
        },
        {
          path: "audit-log",
          name: "审计日志",
          icon: "Document",
          component: SysAuditLogPage,
        },
      ],
    },
  ],
};

/**
 * 供应商管理（supplier AppType）的菜单树
 */
const supplierMenuTree: FrontendAppTypeMenuConfig = {
  appTypeCode: "supplier",
  roleCode:'supplier_admin',
  label: "供应商管理",
  icon: "Shop",
  children: [
    {
      path: "dashboard",
      name: "首页",
      icon: "DataBoard",
      component: SupplierDashboardPage,
    },
    {
      path: "business",
      name: "业务中心",
      icon: "Briefcase",
      children: [
        {
          path: "orders",
          name: "订单中心",
          icon: "Tickets",
          permissions: ["发货", "充值", "接待", "添加"],
          component: SupplierOrdersPage,
        },
        {
          path: "reports",
          name: "报表中心",
          icon: "TrendCharts",
          component: SupplierReportsPage,
        },
      ],
    },
    {
      path: "monitor",
      name: "监控管理",
      icon: "Monitor",
      children: [
        {
          path: "overview",
          name: "监控总览",
          icon: "Odometer",
          component: SupplierOverviewPage,
        },
      ],
    },
  ],
};

/**
 * 所有应用类型的菜单树配置（导出给前端路由生成和后端权限同步使用）
 */
export const menuTrees: FrontendAppTypeMenuConfig[] = [
  systemMenuTree,
  supplierMenuTree,
];

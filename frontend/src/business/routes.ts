/**
 * @fileoverview 业务路由配置。
 *
 * 使用 BusinessMenuItem 类型定义菜单树，框架会自动：
 * 1. 生成路由配置
 * 2. 从 views/ 目录加载对应的 Index.vue 页面
 * 3. 生成侧边栏菜单
 */

import type { BusinessMenuItem } from 'moyan-mfw-base-frontend';

/**
 * 业务菜单树定义
 *
 * 命名规范：
 * - name: 用于生成路由名称和路径（驼峰或小写）
 * - title: 菜单显示文本
 * - icon: Element Plus 图标名称
 * - path: 可选，自定义路径（不传则用 name 生成）
 * - children: 子菜单数组
 */
export const businessMenus: BusinessMenuItem[] = [
  {
    name: 'business',
    title: '业务中心',
    icon: 'Briefcase',
    children: [
      {
        name: 'orders',
        title: '订单中心',
        icon: 'Tickets',
        // 路径自动生成：/business/orders -> views/business/orders/Index.vue
      },
      {
        name: 'reports',
        title: '报表中心',
        icon: 'PieChart',
        // 可以添加额外属性（虽然不会全部传递到路由）
      },
    ],
  },
  {
    name: 'monitor',
    title: '运维中心',
    icon: 'Monitor',
    children: [
      {
        name: 'overview',
        title: '运行概览',
        icon: 'TrendCharts',
      },
    ],
  },
];

/**
 * 自定义路径示例
 * 如果需要精确控制路径，可以使用 path 属性
 */
export const customPathMenus: BusinessMenuItem[] = [
  {
    name: 'system',
    title: '系统管理',
    icon: 'Setting',
    children: [
      {
        path: '/system/user', // 自定义路径
        name: 'user',
        title: '用户管理',
        icon: 'User',
      },
      {
        path: '/system/role',
        name: 'role',
        title: '角色管理',
        icon: 'UserFilled',
      },
    ],
  },
];

// 导出主菜单树
export const businessMenusTree: BusinessMenuItem[] = [
  ...businessMenus,
  ...customPathMenus,
];

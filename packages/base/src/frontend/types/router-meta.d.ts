/**
 * @fileoverview 路由元数据类型定义
 * 定义应用路由的元数据，包括页面标题、认证需求、菜单显示配置等
 */

import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题 */
    title?: string;
    /** 是否需要认证 */
    requiresAuth?: boolean;
    /** 是否在菜单中显示 */
    menu?: boolean;
    /** 菜单标签 */
    menuLabel?: string;
    /** 菜单键名 */
    menuKey?: string;
    /** 菜单图标 */
    menuIcon?: string;
    /** 菜单徽章 */
    menuBadge?: string;
    /** 菜单排序 */
    menuOrder?: number;
    /** 是否固定标签页 */
    affix?: boolean;
  }
}

export {};

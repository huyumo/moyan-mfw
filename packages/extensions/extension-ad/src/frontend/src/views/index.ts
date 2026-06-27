/**
 * @fileoverview 广告扩展包 - 菜单节点配置与组件映射
 *
 * 使用新的 MenuNode + ComponentMap 模式替代原有的 ModuleConfig + PageConfig。
 * 菜单树为纯数据（不含 Vue 组件），组件通过 componentMap 单独映射。
 *
 * 设计原则：
 * - menuNodes: 纯数据菜单树，前后端共享
 * - componentMap: 路径 → Vue 组件映射，仅前端使用
 */

import type { MenuNode } from "@internal/base-shared";
import type { ComponentMap } from "moyan-mfw-base/frontend";
import PlacementList from "./placement/Index.vue";

/**
 * 广告扩展包的菜单节点树（纯数据，不含 Vue 组件）。
 *
 * 菜单结构：
 * - 广告管理（MENU 分组）
 *   - 广告位管理（PAGE 页面）
 */
export const adMenuNodes: MenuNode[] = [
  {
    path: "placement",
    name: "广告位管理",
    icon: "CollectionTag",
    order: 1,
    auth: true,
    permCode: "ext:ad:placement",
    permissions: ["添加", "编辑", "删除"],
  },
];

/**
 * 路径 → 组件的映射表
 *
 * key 为相对路径（不含 /ext/ad/ 前缀），与 menuNodes 中的 path 对应。
 */
export const adComponentMap: ComponentMap = {
  placement: PlacementList,
};
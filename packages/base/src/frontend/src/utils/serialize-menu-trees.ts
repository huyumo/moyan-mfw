/**
 * @fileoverview 菜单树序列化工具。
 *
 * 将带有内联组件的前端菜单树（FrontendAppTypeMenuConfig）序列化为纯数据
 * 格式（AppTypeMenuConfig），用于通过 API 发送给后端做权限同步。
 *
 * 序列化过程递归剥离 `component` 字段，保留所有纯数据字段。
 */

import type { AppTypeMenuConfig, MenuNode } from "@internal/base-shared";
import type { FrontendAppTypeMenuConfig, FrontendMenuNode } from "../router/routes";

/**
 * 递归剥离菜单节点的 component 字段，返回纯数据 MenuNode。
 */
function stripComponent(node: FrontendMenuNode): MenuNode {
  const { component, ...rest } = node;
  const result: MenuNode = { ...rest };
  if (node.children && node.children.length > 0) {
    result.children = node.children.map(stripComponent);
  }
  return result;
}

/**
 * 将前端菜单树（含内联组件）序列化为纯数据格式，供 API 传输使用。
 *
 * @param trees - 前端菜单树配置数组（含 component 字段）
 * @returns 纯数据菜单树配置数组（不含 component 字段）
 */
export function serializeMenuTrees(
  trees: FrontendAppTypeMenuConfig[],
): AppTypeMenuConfig[] {
  return trees.map((tree) => ({
    appTypeCode: tree.appTypeCode,
    label: tree.label,
    icon: tree.icon,
    order: tree.order,
    children: tree.children.map(stripComponent),
  }));
}

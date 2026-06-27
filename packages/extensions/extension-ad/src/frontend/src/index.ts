/**
 * @fileoverview 广告扩展包前端入口
 *
 * 使用新的 MenuNode + ComponentMap + buildRoutesFromMenuTreeWithPrefix 模式。
 * 向后兼容：仍导出 adRoutes 供现有业务层使用。
 */

import { buildRoutesFromMenuTreeWithPrefix } from "moyan-mfw-base/frontend";
import { adMenuNodes, adComponentMap } from "./views/index";

export { adMenuNodes, adComponentMap } from "./views/index";

/**
 * 广告扩展包路由（向后兼容导出）。
 * 路由路径自动添加 `/ext/ad/` 前缀。
 */
export const adRoutes = buildRoutesFromMenuTreeWithPrefix(
  adMenuNodes,
  adComponentMap,
  {
    extensionName: "ad",
    namespaceLabel: "广告管理",
    namespaceIcon: "Notification",
    namespaceOrder: 60,
  },
);
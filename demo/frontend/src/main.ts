/**
 * @fileoverview 前端应用入口文件。
 *
 * 菜单树（含内联组件）定义在 ./menu-trees.ts，作为路由生成的唯一数据源。
 * 后端权限同步通过侧边栏同步按钮（仅 developer 可见）以 API 方式推送。
 */

import {
  createBaseAdminApp,
  registerPermissionValues,
  RouteSyncButton,
} from "moyan-mfw-base/frontend";
import { HeaderCommonActions } from "./components/Layout";
import { menuTrees } from "./menu-trees";
import { AD_EXTENSION_PERMISSION_VALUES } from "moyan-mfw-extension-ad/shared";
import "./permissions";

registerPermissionValues([...AD_EXTENSION_PERMISSION_VALUES]);

const admin = createBaseAdminApp({
  title: "墨焱前端演示",
  menuTrees,
  layout: {
    layoutMode: "dual",
    showTabs: true,
    colorMode: "system",
    themePackage: "default",
  },
  navigation: {
    brandName: "墨焱管理后台",
    brandTagline: "业务演示应用",
    homePath: "/dashboard",
  },
  layoutExtensions: {
    headerCommon: HeaderCommonActions,
    sidebarFooter: RouteSyncButton,
  },
});

const values = await admin.fetchPermissionValues();
admin.initPermissionCache(values);

await admin.mount("#app");

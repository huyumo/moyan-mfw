/**
 * @fileoverview 前端应用入口文件。
 *
 * 菜单树方案：使用手动编写的菜单树配置替代 import.meta.glob 自动扫描。
 * 组件映射表（componentMap）将菜单路径映射到实际的 Vue 组件。
 */

import {
  createBaseAdminApp,
  registerPermissionValues,
} from "moyan-mfw-base/frontend";
import { HeaderCommonActions } from "./components/Layout";
import { componentMap } from "./router";
import { adRoutes } from "moyan-mfw-extension-ad/frontend";
import { AD_EXTENSION_PERMISSION_VALUES } from "moyan-mfw-extension-ad/shared";
import { menuTrees } from "moyan-mfw-shared";
import "./permissions";

registerPermissionValues([...AD_EXTENSION_PERMISSION_VALUES]);

const admin = createBaseAdminApp({
  title: "墨焱前端演示",
  menuTrees,
  componentMap,
  routes: [...adRoutes],
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
  },
});

const values = await admin.fetchPermissionValues();
admin.initPermissionCache(values);

await admin.mount("#app");

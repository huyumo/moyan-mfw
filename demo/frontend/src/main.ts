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
  configureAmap,
} from "moyan-mfw-base/frontend";
import { HeaderCommonActions } from "./components/Layout";
import { menuTrees } from "./menu-trees";
import { AD_EXTENSION_PERMISSION_VALUES } from "moyan-mfw-extension-ad/shared";
import { SCHEDULER_EXTENSION_PERMISSION_VALUES } from "moyan-mfw-extension-scheduler/shared";
import { LEDGER_EXTENSION_PERMISSION_VALUES } from "moyan-mfw-extension-ledger/shared";
import { SMS_EXTENSION_PERMISSION_VALUES } from "moyan-mfw-extension-sms/shared";
import { SCAN_CODE_EXTENSION_PERMISSION_VALUES } from "moyan-mfw-extension-scan-code/shared";
import pkg from "../package.json";
import "./permissions";
// 业务层注册借贷记账扩展筛选动态下拉选项加载器（campaigns 等）
import "./ledger-option-loaders";

registerPermissionValues([...AD_EXTENSION_PERMISSION_VALUES, ...SCHEDULER_EXTENSION_PERMISSION_VALUES, ...LEDGER_EXTENSION_PERMISSION_VALUES, ...SMS_EXTENSION_PERMISSION_VALUES, ...SCAN_CODE_EXTENSION_PERMISSION_VALUES]);

// 配置高德地图凭证
configureAmap({
  key: import.meta.env.VITE_AMAP_KEY,
  securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE,
});

const admin = createBaseAdminApp({
  title: "墨焱前端演示",
  menuTrees,
  appVersion: pkg.version,
  layout: {
    layoutMode: "sidebar",
    showTabs: true,
    colorMode: "system",
    themePackage: "tech",
  },
  navigation: {
    brandName: "墨焱管理后台",
    brandTagline: "业务演示应用",
    homePath: "/",
  },
  layoutExtensions: {
    headerCommon: HeaderCommonActions,
    sidebarFooter: RouteSyncButton,
  },
  loginComponent: () => import('./views/custom-login/index.vue'),
});

const values = await admin.fetchPermissionValues();
admin.initPermissionCache(values);

await admin.mount("#app");

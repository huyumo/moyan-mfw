/**
 * @fileoverview 管理后台应用主入口模块
 * 统一导出创建管理后台应用的相关函数、配置和类型定义。
 */

import "./plugins";

export * from "./create-base-admin-app";
export * from "./create-extension-frontend-app";
export * from "./router";
export * from "./layouts";
export * from "./config/layout-defaults";
export * from "./types/layout-types";

export type {
  PermissionName,
  DefaultPermissionName,
  ExtensionPermissionName,
} from "./utils/permissions";
export {
  createBusinessPageConfigFn,
  initPermissionCache,
  getPermissionValueCache,
} from "./utils/permissions";

export * from "./components";
export * from "./utils/image";
export * from "./composables";
export { useLayoutStore } from "./store/layout-store";
export { useAuthStore } from "./store/auth-store";
export { useAppLoadingStore } from "./store/app-loading-store";
export * from "./hooks";
export * from "./directives";
export * from "./themes";
export * from "./constants/storage-keys";
export { uploadConfig, getUploader, uploadImage } from "./config/upload-config";
export type { UploadConfig } from "./config/upload-config";
export { getAccessToken, getCurrentAppId } from "./plugins/api";

// 内置系统管理页面组件（业务层按需引入，框架不再自动加载）
export { default as SysUserPage } from "./views/sys/user/Index.vue";
export { default as SysRolePage } from "./views/sys/role/Index.vue";
export { default as SysAppPage } from "./views/sys/app/Index.vue";
export { default as SysAppTypePage } from "./views/sys/app-type/Index.vue";
export { default as SysMemberPage } from "./views/sys/member/Index.vue";
export { default as SysPermissionPage } from "./views/sys/permission/Index.vue";
export { default as SysAuditLogPage } from "./views/sys/audit-log/Index.vue";
// 通用页面组件
export { default as DashboardPage } from "./views/dashboard/index.vue";

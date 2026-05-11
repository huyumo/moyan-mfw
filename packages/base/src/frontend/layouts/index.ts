/**
 * @fileoverview 布局模块统一导出
 * @description 导出所有布局相关的组件、组合式函数和面板
 */

// 主布局组件
export { default as AdminLayout } from './AdminLayout.vue';

// 布局面板组件
export { default as AsidePanel } from './panels/AsidePanel.vue';
export { default as HeaderPanel } from './panels/HeaderPanel.vue';
export { default as MainPanel } from './panels/MainPanel.vue';
export { default as NavigationPanel } from './panels/NavigationPanel.vue';
export { default as SettingsPanel } from './panels/SettingsPanel.vue';
export { default as TabsPanel } from './panels/TabsPanel.vue';
export { default as UserPanel } from './panels/UserPanel.vue';

// 布局组合式函数
export * from './composables/use-admin-layout';

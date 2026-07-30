/**
 * @fileoverview 定时任务扩展包自定义权限标签
 * @description 声明本扩展包使用的权限标签，供业务层统一收集注入
 *
 * 使用方式：
 *   业务层 backend/src/main.ts / frontend/src/main.ts 中：
 *   import { SCHEDULER_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-scheduler/backend' | '/shared'
 *   createBaseBackendApp({ permissionValues: [...SCHEDULER_EXTENSION_PERMISSION_VALUES] })
 *
 * 位值分配规则（append-only）：
 *   权限标签按业务层收集的去重顺序依次分配位值，已分配的标签永不回收。
 *   新增标签追加到列表末尾 → 新 bitPosition → 已有角色数据不受影响。
 *
 * 注意："查看"、"编辑"、"删除" 已在框架 DEFAULT_PERMISSION_VALUES 中，无需重复声明。
 */

export const SCHEDULER_EXTENSION_PERMISSION_VALUES = [
  '执行',  // 手动触发任务
] as const;

export type SchedulerExtensionPermissionName = (typeof SCHEDULER_EXTENSION_PERMISSION_VALUES)[number];

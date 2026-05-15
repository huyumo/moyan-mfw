/**
 * @fileoverview 广告扩展包自定义权限标签
 * @description 声明本扩展包使用的权限标签，供业务层统一收集注入
 *
 * 使用方式：
 *   业务层 backend/src/main.ts / frontend/src/main.ts 中：
 *   import { AD_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-ad/backend' | '/shared'
 *   createBaseBackendApp({ permissionValues: [...AD_EXTENSION_PERMISSION_VALUES] })
 *
 * 位值分配规则（append-only）：
 *   权限标签按业务层收集的去重顺序依次分配位值，已分配的标签永不回收。
 *   新增标签追加到列表末尾 → 新 bitPosition → 已有角色数据不受影响。
 *
 * @example
 *   // 未来扩展包需要自定义标签时：
 *   export const AD_EXTENSION_PERMISSION_VALUES = [
 *     '扣款',
 *     '冻结',
 *   ] as const;
 */

export const AD_EXTENSION_PERMISSION_VALUES: readonly string[] = [
  // 当前使用的标签均在框架内置列表中：
  // - DEFAULT_PERMISSION_VALUES: '添加', '编辑', '删除'
  // - EXTENSION_PERMISSION_VALUES: '发布'
  // 暂无扩展包独有的自定义标签，待业务需要时追加
  // 追加示例：'扣款', '冻结', '转账' 等
];

export type AdExtensionPermissionName = (typeof AD_EXTENSION_PERMISSION_VALUES)[number];

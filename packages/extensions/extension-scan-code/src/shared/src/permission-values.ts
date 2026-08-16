/**
 * @fileoverview 扫码扩展包自定义权限标签
 * @description 声明本扩展包使用的权限标签，供业务层统一收集注入
 *
 * 使用方式：
 *   业务层 backend/src/main.ts / frontend/src/main.ts 中：
 *   import { SCAN_CODE_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-scan-code/backend' | '/shared'
 *   createBaseBackendApp({ permissionValues: [...SCAN_CODE_EXTENSION_PERMISSION_VALUES] })
 *
 * 位值分配规则（append-only）：
 *   权限标签按业务层收集的去重顺序依次分配位值，已分配的标签永不回收。
 *   新增标签追加到列表末尾 → 新 bitPosition → 已有角色数据不受影响。
 */

export const SCAN_CODE_EXTENSION_PERMISSION_VALUES: readonly string[] = [
  // 当前使用的标签均在框架内置列表中：
  // - DEFAULT_PERMISSION_VALUES: '添加', '编辑', '删除'
  // 暂无扩展包独有的自定义标签，待业务需要时追加
  // 追加示例：'核销', '批量生成' 等
];

export type ScanCodeExtensionPermissionName = (typeof SCAN_CODE_EXTENSION_PERMISSION_VALUES)[number];

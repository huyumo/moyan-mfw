/**
 * @fileoverview 扫码扩展包共享层入口
 * @description 前后端通信的常量、类型与权限定义
 */

export {
  SCAN_CODE_CHARSETS,
  SCAN_CODE_CHARSET_LABELS,
  SCAN_CODE_TYPE_LABELS,
  SCAN_CODE_PATHS,
} from './constants';
export type { ScanCodeCharsetId } from './constants';
export type { ScanCodeSettingItem } from './types';
export { SCAN_CODE_EXTENSION_PERMISSION_VALUES } from './permission-values';
export type { ScanCodeExtensionPermissionName } from './permission-values';

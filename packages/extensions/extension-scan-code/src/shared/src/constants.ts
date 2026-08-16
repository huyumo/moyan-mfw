/**
 * @fileoverview 扫码扩展包共享常量
 */

/**
 * 字符集预设（配置页面下拉项 & 后端码生成共用）
 *
 * A-Z1-9：排除 0，避免与字母 O 混淆（默认推荐）
 * A-Z0-9：完整大写字母 + 数字
 */
export const SCAN_CODE_CHARSETS = {
  'A-Z1-9': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789',
  'A-Z0-9': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
} as const;

export type ScanCodeCharsetId = keyof typeof SCAN_CODE_CHARSETS;

/** 字符集预设显示名 */
export const SCAN_CODE_CHARSET_LABELS: Record<string, string> = {
  'A-Z1-9': '大写字母 + 数字1-9（排除0，推荐）',
  'A-Z0-9': '大写字母 + 数字0-9',
};

/** 二维码类型选项（业务方前端展示用） */
export const SCAN_CODE_TYPE_LABELS: Record<number, string> = {
  1: '可多次使用',
  2: '只允许使用一次',
};

/** 前端路由路径 */
export const SCAN_CODE_PATHS = {
  /** 扫码配置页 */
  CONFIG: '/ext/scan-code/config',
} as const;

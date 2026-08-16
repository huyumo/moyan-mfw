/**
 * @fileoverview 扫码扩展包前后端共享类型（配置管理页面用）
 */

import type { ScanCodeCharsetId } from './constants';

/**
 * 码生成策略配置（ext_scan_code_settings 单行，API 视图）
 */
export interface ScanCodeSettingItem {
  /** 分组数（2~5） */
  groupCount: number;
  /** 每组字符数（3~5） */
  groupLength: number;
  /** 分组分隔符（最长 2 字符，空串表示不分隔） */
  separator: string;
  /** 字符集预设 */
  charset: ScanCodeCharsetId;
  /** 场景白名单（null=不限制） */
  scenes: string[] | null;
}

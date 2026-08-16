/**
 * @fileoverview scan-code 类型定义
 * @description 通用二维码内容生成/解析的类型接口，与框架无关
 */

import type { ScanCodeCharsetId } from 'moyan-mfw-extension-scan-code/shared';

/** 二维码类型 */
export enum ScanCodeType {
  /** 可多次使用 */
  MULTI_USE = 1,
  /** 只允许使用一次 */
  SINGLE_USE = 2,
}

/** 二维码状态 */
export enum ScanCodeStatus {
  /** 有效 */
  ACTIVE = 1,
  /** 已使用（单次类型核销后） */
  USED = 2,
  /** 已过期 */
  EXPIRED = 3,
}

/**
 * 码格式配置（来自 ext_scan_code_settings，配置页面管理）
 *
 * 缺省保持原 lib 行为：3 组 × 4 字符 + '-' 分隔（如 A5DS-DSDF-O1SF）
 */
export interface CodeFormatOptions {
  /** 分组数（2~5，默认 3） */
  groupCount?: number;
  /** 每组字符数（3~5，默认 4） */
  groupLength?: number;
  /** 分组分隔符（最长 2 字符，空串表示不分隔，默认 '-'） */
  separator?: string;
  /** 字符集预设（默认 'A-Z1-9'，排除 0 避免与 O 混淆） */
  charset?: ScanCodeCharsetId;
}

/** 生成二维码参数 */
export interface GenerateOptions {
  /** 二维码类型：1=可多次使用, 2=只允许使用一次 */
  type: ScanCodeType;
  /** 业务场景标识（如 points/gift/lottery/pickup/user_promo/store_promo） */
  scene: string;
  /** 过期时间戳（毫秒），不传为长期有效 */
  expiredAt?: number;
  /** 业务数据（由使用者自行定义约束，完整存入 data JSON 字段） */
  data: Record<string, any>;
  /** 需要建索引查询的字段名列表（写入 ext_scan_code_data 扩展表，不传则不写扩展表） */
  indexFields?: string[];
}

/** 生成二维码结果 */
export interface GenerateResult {
  /** 二维码内容（= 数据库记录ID） */
  code: string;
}

/** 解析二维码结果 */
export interface ParseResult {
  /** 二维码内容（= 记录ID） */
  code: string;
  /** 二维码类型 */
  type: ScanCodeType;
  /** 业务场景 */
  scene: string;
  /** 业务数据 */
  data: Record<string, any>;
  /** 状态 */
  status: ScanCodeStatus;
  /** 过期时间 */
  expiredAt: Date | null;
  /** 最后使用时间 */
  lastUsedAt: Date | null;
  /** 使用次数 */
  usedCount: number;
  /** 创建时间 */
  createdAt: Date;
}

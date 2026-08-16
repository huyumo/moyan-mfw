/**
 * @fileoverview 通用二维码内容管理器（纯 TS，与 NestJS 解耦）
 * @description 提供扫码记录的核心校验逻辑，不依赖任何 DI 容器。
 *
 * 本类仅提供纯业务校验方法，实际的数据库操作由 NestJS Service 层调用。
 * 码格式可通过 CodeFormatOptions 配置（配置页面管理），缺省为 4-4-4 三组 + '-' 分隔。
 */

import { ScanCodeType, ScanCodeStatus, type GenerateOptions, type CodeFormatOptions } from './types';
import { SCAN_CODE_CHARSETS } from 'moyan-mfw-extension-scan-code/shared';
import { randomInt } from 'node:crypto';

/** 默认码格式：3 组 × 4 字符 + '-' 分隔（如 A5DS-DSDF-O1SF） */
export const DEFAULT_CODE_FORMAT: Required<CodeFormatOptions> = {
  groupCount: 3,
  groupLength: 4,
  separator: '-',
  charset: 'A-Z1-9',
};

/** 码内容最大长度（主键列 varchar(32)） */
export const MAX_CODE_LENGTH = 32;

export class ScanCodeManager {
  /**
   * 计算码内容总长度（分组字符数 + 分隔符占用）
   */
  static computeCodeLength(format: CodeFormatOptions = {}): number {
    const { groupCount, groupLength, separator } = { ...DEFAULT_CODE_FORMAT, ...format };
    return groupCount * groupLength + (groupCount - 1) * separator.length;
  }

  /**
   * 生成二维码ID（= 记录ID）
   *
   * 默认格式：XXXX-XXXX-XXXX（4-4-4），12 位字符 + 2 个连字符，共 14 位。
   * 可通过 format 自定义分组数/每组长度/分隔符/字符集。
   * 示例：A5DS-DSDF-O1SF
   *
   * @param format 码格式配置（缺省 4-4-4 + '-'）
   * @returns 生成的二维码ID
   * @throws Error 码内容超出最大长度（32 字符）
   */
  static generateCode(format: CodeFormatOptions = {}): string {
    const { groupCount, groupLength, separator, charset } = {
      ...DEFAULT_CODE_FORMAT,
      ...format,
    };

    const totalLength = ScanCodeManager.computeCodeLength(format);
    if (totalLength > MAX_CODE_LENGTH) {
      throw new Error(
        `码内容长度超限：${totalLength} > ${MAX_CODE_LENGTH}（分组 ${groupCount}×${groupLength} + 分隔符 "${separator}"）`,
      );
    }

    const chars = SCAN_CODE_CHARSETS[charset] ?? SCAN_CODE_CHARSETS['A-Z1-9'];
    const group = () =>
      Array.from({ length: groupLength }, () => chars[randomInt(chars.length)]).join('');
    return Array.from({ length: groupCount }, () => group()).join(separator);
  }

  /**
   * 校验并准备生成参数
   *
   * @param options 原始生成参数
   * @param format 码格式配置（缺省 4-4-4 + '-'）
   * @returns 处理后的参数（如转换 expiredAt 为 Date，并生成记录ID）
   */
  static prepareGenerate(
    options: GenerateOptions,
    format: CodeFormatOptions = {},
  ): {
    id: string;
    type: ScanCodeType;
    scene: string;
    data: Record<string, any>;
    expiredAt: Date | null;
    status: ScanCodeStatus;
  } {
    return {
      id: ScanCodeManager.generateCode(format),
      type: options.type,
      scene: options.scene,
      data: options.data,
      expiredAt: options.expiredAt ? new Date(options.expiredAt) : null,
      status: ScanCodeStatus.ACTIVE,
    };
  }

  /**
   * 检查记录是否过期，如过期返回新的状态值
   *
   * @param record 当前记录
   * @returns 需要更新的状态，或 null 表示未过期
   */
  static checkExpired(record: {
    status: ScanCodeStatus;
    expiredAt: Date | null;
  }): ScanCodeStatus | null {
    if (
      record.expiredAt &&
      new Date() > record.expiredAt &&
      record.status === ScanCodeStatus.ACTIVE
    ) {
      return ScanCodeStatus.EXPIRED;
    }
    return null;
  }

  /**
   * 计算使用后的更新字段
   *
   * @param record 当前记录
   * @returns 需要更新的字段对象
   * @throws Error 如果状态不允许使用
   */
  static computeUseUpdate(record: {
    type: ScanCodeType;
    status: ScanCodeStatus;
    usedCount: number;
  }): {
    status?: ScanCodeStatus;
    lastUsedAt: Date;
    usedCount: number;
  } {
    if (record.status === ScanCodeStatus.EXPIRED) {
      throw new Error('二维码已过期');
    }

    if (record.type === ScanCodeType.SINGLE_USE) {
      if (record.status === ScanCodeStatus.USED) {
        throw new Error('二维码已使用，不可重复核销');
      }
      return {
        status: ScanCodeStatus.USED,
        lastUsedAt: new Date(),
        usedCount: record.usedCount + 1,
      };
    }

    // 多次使用：仅记录使用次数
    return {
      lastUsedAt: new Date(),
      usedCount: record.usedCount + 1,
    };
  }
}

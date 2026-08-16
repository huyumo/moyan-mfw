/**
 * @fileoverview 扫码码生成策略配置实体
 * @description 单行配置，由扫码配置页面管理，控制 generate() 的码格式与场景白名单
 */

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Base } from 'moyan-mfw-base/backend';

@Entity('ext_scan_code_settings')
export class ScanCodeSetting extends Base {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 分组数（2~5，默认 3） */
  @Column({ type: 'int', nullable: false, default: 3, comment: '分组数' })
  groupCount: number;

  /** 每组字符数（3~5，默认 4） */
  @Column({ type: 'int', nullable: false, default: 4, comment: '每组字符数' })
  groupLength: number;

  /** 分组分隔符（最长 2 字符，空串表示不分隔，默认 '-'） */
  @Column({ type: 'varchar', length: 8, nullable: false, default: '-', comment: '分组分隔符' })
  separator: string;

  /** 字符集预设（默认 'A-Z1-9'，排除 0 防混淆） */
  @Column({ type: 'varchar', length: 16, nullable: false, default: 'A-Z1-9', comment: '字符集预设' })
  charset: string;

  /** 场景白名单（null=不限制） */
  @Column({ type: 'json', nullable: true, comment: '场景白名单（null=不限制）' })
  scenes: string[] | null;
}

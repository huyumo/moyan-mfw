/**
 * @fileoverview 扫码记录实体
 * @description 通用二维码内容生成记录表
 *
 * 核心设计：
 * - id 字段即为主键，也是二维码内容（扫码后直接 WHERE id = code 查询）
 * - 默认格式 14 位（12 位字符 + 2 个连字符，如 A5DS-DSDF-O1SF），配置页面可自定义分组/分隔符，
 *   列宽放宽到 32 支持更长格式
 * - type 区分二维码类型：1=可多次使用, 2=只允许使用一次
 * - scene 标识业务场景（如 points/gift/lottery/pickup），可经配置页面设置白名单
 * - data 为 JSON 字段，由使用者自行定义约束
 */

import { Entity, PrimaryColumn, Column, Index } from 'typeorm';
import { Base } from 'moyan-mfw-base/backend';

@Entity('ext_scan_code_records')
@Index('idx_scan_code_scene', ['scene'])
@Index('idx_scan_code_status', ['status'])
@Index('idx_scan_code_scene_status', ['scene', 'status']) // 复合索引：场景+状态查询优化
export class ScanCodeRecord extends Base {
  /** 二维码内容 = 记录ID，扫码后直接用此值查库（默认 14 位：12 位字符 + 2 个连字符，如 A5DS-DSDF-O1SF） */
  @PrimaryColumn({
    type: 'varchar',
    length: 32,
    comment: '二维码内容（= 记录ID）',
  })
  id: string;

  /** 二维码类型：1=可多次使用, 2=只允许使用一次 */
  @Column({
    type: 'int',
    nullable: false,
    comment: '二维码类型：1=可多次使用, 2=只允许使用一次',
  })
  type: number;

  /** 业务场景标识（如 points/gift/lottery/pickup） */
  @Column({
    type: 'varchar',
    length: 32,
    nullable: false,
    comment: '业务场景标识',
  })
  scene: string;

  /** 业务数据（JSON格式，由使用者自行定义约束） */
  @Column({
    type: 'json',
    nullable: false,
    comment: '业务数据',
  })
  data: Record<string, any>;

  /** 状态：1=有效, 2=已使用(单次类型), 3=已过期 */
  @Column({
    type: 'int',
    nullable: false,
    default: 1,
    comment: '状态：1=有效, 2=已使用, 3=已过期',
  })
  status: number;

  /** 过期时间，null 表示长期有效 */
  @Column({
    type: 'datetime',
    nullable: true,
    comment: '过期时间',
  })
  expiredAt: Date | null;

  /** 最后使用时间（多次使用类型记录每次使用） */
  @Column({
    type: 'datetime',
    nullable: true,
    comment: '最后使用时间',
  })
  lastUsedAt: Date | null;

  /** 使用次数（多次使用类型累计） */
  @Column({
    type: 'int',
    nullable: false,
    default: 0,
    comment: '使用次数',
  })
  usedCount: number;

  /** 操作人ID（核销时记录） */
  @Column({
    type: 'varchar',
    length: 36,
    nullable: true,
    comment: '操作人ID',
  })
  operatorId: string | null;

  /** 门店ID（核销时记录） */
  @Column({
    type: 'varchar',
    length: 36,
    nullable: true,
    comment: '门店ID',
  })
  storeId: string | null;
}

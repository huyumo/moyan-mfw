/**
 * @fileoverview 扫码记录业务数据扩展表
 * @description 将 ScanCodeRecord.data JSON 中需要查询的字段拆为独立行，支持高效索引查询。
 *
 * 设计原则：
 * - ScanCodeRecord.data JSON 存放完整业务数据（包括不需要索引的字段）
 * - 本表只存放需要建索引查询的关键字段（由 generate 的 indexFields 参数指定）
 * - generate 时按 indexFields 写入扩展表，parse 时仍读 data JSON
 *
 * 例如查"某用户的推广码"：
 *   SELECT s.* FROM ext_scan_code_records s
 *   INNER JOIN ext_scan_code_data d ON d.scanCodeRecordId = s.id
 *   WHERE d.field = 'userId' AND d.value = 'xxx'
 */

import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { Base } from 'moyan-mfw-base/backend';

@Entity('ext_scan_code_data')
@Index('idx_scan_data_record', ['scanCodeRecordId'])
@Index('idx_scan_data_field_value', ['field', 'value'])
export class ScanCodeData extends Base {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32, comment: '关联扫码记录ID（ext_scan_code_records.id）' })
  scanCodeRecordId: string;

  @Column({ type: 'varchar', length: 50, comment: '字段名（如 userId, merchantId）' })
  field: string;

  @Column({ type: 'varchar', length: 255, comment: '字段值' })
  value: string;
}

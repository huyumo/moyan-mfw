/**
 * @fileoverview 文档扩展字段实体（EAV）
 * @description 通用文档扩展表，按 extKey 为不同文档类型挂载自定义字段
 */

import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { Base } from 'moyan-mfw-base/backend';
import { ExtValueType } from 'moyan-mfw-extension-document/shared';

@Entity('mfw_document_ext')
@Index('uk_doc_key', ['documentId', 'extKey', 'deleteAt'], { unique: true })
@Index('idx_document_id', ['documentId'])
export class DocumentExt extends Base {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'document_id', type: 'bigint', comment: '文档 ID' })
  documentId: number;

  @Column({ name: 'ext_key', type: 'varchar', length: 128, comment: '扩展属性键' })
  extKey: string;

  @Column({ name: 'ext_value', type: 'json', comment: '扩展属性值 {data: any}' })
  extValue: { data: any };

  @Column({ name: 'value_type', type: 'varchar', length: 16, default: ExtValueType.STRING, comment: '值类型' })
  valueType: string;

  @Column({ type: 'varchar', length: 256, nullable: true, comment: '描述' })
  description?: string;
}

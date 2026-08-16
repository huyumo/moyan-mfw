/**
 * @fileoverview 短信模板实体
 * @description 业务场景 → 签名 + 模板Code + 参数key 的映射，由短信配置页面管理。
 * 替代原内存模板注册表（register() 程序化注册仍保留，优先级高于本表）。
 */

import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { Base } from 'moyan-mfw-base/backend';

@Entity('ext_sms_templates')
@Index('uk_sms_template_scene', ['scene', 'deleteAt'], { unique: true })
@Index('idx_sms_template_code', ['templateCode'])
export class SmsTemplate extends Base {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 业务场景名（如 login_code），唯一 */
  @Column({ type: 'varchar', length: 64, nullable: false, comment: '业务场景名（如 login_code）' })
  scene: string;

  /** 短信签名 */
  @Column({ type: 'varchar', length: 64, nullable: false, comment: '短信签名' })
  signName: string;

  /** 短信模板 Code（如 SMS_509465234） */
  @Column({ type: 'varchar', length: 64, nullable: false, comment: '模板 Code' })
  templateCode: string;

  /** 模板参数 key 列表 */
  @Column({ type: 'json', nullable: false, comment: '模板参数 key 列表' })
  paramKeys: string[];

  /** 模板描述 */
  @Column({ type: 'varchar', length: 255, nullable: true, comment: '模板描述' })
  description: string | null;
}

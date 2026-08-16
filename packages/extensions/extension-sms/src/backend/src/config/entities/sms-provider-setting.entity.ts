/**
 * @fileoverview 短信运营商凭证配置实体
 * @description 单行配置，由短信配置页面管理，优先级高于环境变量
 */

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Base } from 'moyan-mfw-base/backend';

@Entity('ext_sms_provider_settings')
export class SmsProviderSetting extends Base {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 运营商：aliyun（预留 tencent/huawei） */
  @Column({
    type: 'varchar',
    length: 32,
    nullable: false,
    comment: '运营商：aliyun（预留 tencent/huawei）',
  })
  provider: string;

  /** AccessKey ID */
  @Column({ type: 'varchar', length: 128, nullable: false, comment: 'AccessKey ID' })
  accessKeyId: string;

  /** AccessKey Secret（API 返回时需脱敏） */
  @Column({ type: 'varchar', length: 256, nullable: false, comment: 'AccessKey Secret' })
  accessKeySecret: string;

  /** 默认短信签名（可被模板级签名覆盖），null 表示未设置 */
  @Column({ type: 'varchar', length: 64, nullable: true, comment: '默认短信签名' })
  defaultSignName: string | null;
}

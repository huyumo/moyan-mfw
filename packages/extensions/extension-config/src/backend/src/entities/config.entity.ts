/**
 * @fileoverview 配置管理实体
 * @description 存储应用配置数据，支持公共/私有分类和租户隔离
 */

import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { Base } from 'moyan-mfw-base/backend';
import { ConfigType } from '@internal/config-shared';

@Entity('mfw_config')
@Index('idx_app_group', ['appId', 'groupKey'])
@Index('uk_app_group_config', ['appId', 'groupKey', 'configKey', 'deleteAt'], { unique: true })
export class Config extends Base {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', nullable: true, comment: '应用 ID，NULL 表示全局配置' })
  appId?: number;

  @Column({ name: 'group_key', length: 64, comment: '配置分组标识' })
  groupKey: string;

  @Column({ name: 'config_key', length: 128, comment: '配置项标识' })
  configKey: string;

  @Column({ name: 'config_value', type: 'json', comment: '配置值 {data: any}' })
  configValue: Record<string, any>;

  @Column({
    name: 'config_type',
    type: 'tinyint',
    default: ConfigType.PUBLIC,
    comment: '配置类型：0=公共 1=私有',
  })
  configType: ConfigType;

  @Column({ length: 256, nullable: true, comment: '配置描述', type: 'varchar' })
  description?: string;
}

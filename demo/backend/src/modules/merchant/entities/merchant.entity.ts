/**
 * @fileoverview 商家扩展实体
 * @description 展示业务层维护商家实体扩展表，通过 SPI 与框架应用实例（sys_apps）关联同步
 */

import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { Base } from 'moyan-mfw-base/backend';

/**
 * 商家实体（业务扩展表）
 * @description 业务侧维护店铺设置/logo/简称/分佣配置等扩展信息；
 * appId 关联框架 sys_apps 应用实例，由 AppEntitySpi 同步维护
 */
@Entity('merchant')
export class Merchant extends Base {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 关联框架应用实例 sys_apps.id（由 AppEntitySpi 同步创建，唯一） */
  @Column({ length: 36, unique: true, comment: '关联应用实例 ID' })
  appId: string;

  /** 店铺名称 */
  @Column({ length: 100, comment: '店铺名称' })
  merchantName: string;

  /** 商家编码（业务唯一，同步为应用编码 appCode） */
  @Column({ length: 50, unique: true, comment: '商家编码' })
  merchantCode: string;

  /** 简称 */
  @Column({ length: 50, nullable: true, comment: '简称' })
  shortName: string;

  /** 店铺 logo（JSON） */
  @Column({ type: 'json', nullable: true, comment: '店铺 logo' })
  logo: any;

  /** 店铺设置（JSON 扩展） */
  @Column({ type: 'json', nullable: true, comment: '店铺设置' })
  shopSettings: any;

  /** 分佣配置（JSON 扩展） */
  @Column({ type: 'json', nullable: true, comment: '分佣配置' })
  commissionConfig: any;

  /** 业务状态：1=启用 0=禁用（与框架 appStatus 同步） */
  @Column({ type: 'int', default: 1, comment: '业务状态 1=启用 0=禁用' })
  status: number;
}

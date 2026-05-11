/**
 * @fileoverview 供应商成员扩展实体
 * @description 展示如何扩展 AppMember 添加业务字段
 */

import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Base, AppMember } from 'moyan-base/backend';

@Entity('supplier_member_profile')
export class SupplierMemberProfile extends Base {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, comment: '公司名称' })
  companyName: string;

  @Column({ length: 50, nullable: true, comment: '营业执照号' })
  businessLicense: string;

  @Column({ length: 20, nullable: true, comment: '联系电话' })
  contactPhone: string;

  @Column({ type: 'text', nullable: true, comment: '公司地址' })
  address: string;

  @ManyToOne(() => AppMember)
  @JoinColumn({ name: 'member_id' })
  member: AppMember;
}
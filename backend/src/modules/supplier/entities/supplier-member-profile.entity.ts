/**
 * @fileoverview 供应商成员扩展实体
 */

import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Base, AppMember } from 'moyan-base-backend';

@Entity('supplier_member_profile')
export class SupplierMemberProfile extends Base {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  companyName: string;

  @Column({ length: 50, nullable: true })
  businessLicense?: string;

  @Column({ length: 200, nullable: true })
  address?: string;

  @ManyToOne(() => AppMember)
  @JoinColumn()
  member: AppMember;
}
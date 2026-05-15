/**
 * @fileoverview 角色权限关联实体
 * @description 角色与权限的多对多关联关系
 */

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { Base } from '../../../../../common/entities/base.entity';
import { Role } from './role.entity';
import { Permission } from '../../../permission/entities/permission.entity';

/**
 * 角色权限关联实体
 * @description 记录角色与权限的关联关系及权限值
 */
@Entity('sys_role_permissions')
@Unique(['roleId', 'permissionId'])
export class RolePermission {
  /**
   * 主键 ID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 角色 ID
   */
  @Column({ type: 'char', length: 36, comment: '角色 ID' })
  @Index()
  roleId: string;

  /**
   * 角色
   */
  @ManyToOne(() => Role)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  /**
   * 权限 ID
   */
  @Column({ type: 'char', length: 36, comment: '权限 ID' })
  @Index()
  permissionId: string;

  /**
   * 权限
   */
  @ManyToOne(() => Permission)
  @JoinColumn({ name: 'permissionId' })
  permission: Permission;

  /**
   * 权限值
   * @description 位运算权限值，定义角色在此权限点上的具体操作权限
   */
  @Column({ type: 'bigint', unsigned: true, comment: '权限值 - 位运算权限值，定义具体操作权限' })
  permissionValue: bigint;
}

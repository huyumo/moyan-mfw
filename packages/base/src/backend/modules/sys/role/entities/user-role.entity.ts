/**
 * @fileoverview 用户角色关联实体
 * @description 用户与角色的多对多关联关系，通过 appId 实现应用实例级隔离
 */

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Role } from './role.entity';

/**
 * 用户角色关联实体
 * @description 记录用户在指定应用实例下的角色分配，每个 UserRole 必须绑定到具体应用实例
 */
@Entity('sys_user_roles')
@Unique(['userId', 'roleId', 'appId'])
export class UserRole {
  /**
   * 主键 ID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 用户 ID
   */
  @Column({ type: 'char', length: 36, comment: '用户 ID' })
  @Index()
  userId: string;

  /**
   * 用户
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

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
   * 应用实例 ID
   * @description 角色分配所属的应用实例，每个 UserRole 必须绑定到一个具体的应用实例
   */
  @Column({ type: 'char', length: 36, comment: '应用实例 ID - 角色分配所属的具体应用实例' })
  @Index()
  appId: string;
}

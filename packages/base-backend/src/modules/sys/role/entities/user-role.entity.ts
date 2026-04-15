/**
 * @fileoverview 用户角色关联实体
 * @description 用户与角色的多对多关联关系
 */

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { Base } from '../../../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Role } from './role.entity';

/**
 * 用户角色关联实体
 * @description 记录用户与角色的关联关系
 */
@Entity('sys_user_roles')
@Unique(['userId', 'roleId'])
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
}

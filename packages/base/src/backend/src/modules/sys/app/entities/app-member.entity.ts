/**
 * @fileoverview 应用成员关联实体
 * @description 应用与成员的关联关系
 */

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { Base } from '../../../../../common/entities/base.entity';
import { App } from './app.entity';
import { User } from '../../../user/entities/user.entity';
import { Role } from '../../../role/entities/role.entity';

/**
 * 应用成员关联实体
 * @description 记录应用与成员的关联关系，包含成员在应用中的角色
 */
@Entity('sys_app_members')
@Unique(['appId', 'userId'])
export class AppMember extends Base {
  /**
   * 主键 ID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 应用 ID
   */
  @Column({ type: 'char', length: 36, comment: '应用 ID' })
  @Index()
  appId: string;

  /**
   * 应用
   */
  @ManyToOne(() => App)
  @JoinColumn({ name: 'appId' })
  app: App;

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

}

/**
 * @fileoverview 应用类型权限池实体
 * @description 定义应用类型可用的权限池，角色权限只能从权限池中选择
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Base } from '../../../../../common/entities/base.entity';
import { AppType } from './app-type.entity';
import { Permission } from '../../../permission/entities/permission.entity';

/**
 * 应用类型权限池实体
 * @description 应用类型与权限的多对多关联，定义应用类型可用的权限池
 *
 * @example
 * ```typescript
 * // 权限池配置
 * const appTypePermission = new AppTypePermissionEntity();
 * appTypePermission.appTypeId = 'app-type-uuid';
 * appTypePermission.permissionId = 'permission-uuid';
 * appTypePermission.permissionValue = 3n; // ADD|EDIT
 * ```
 */
@Entity('sys_app_type_permissions')
@Unique(['appTypeId', 'permissionId'])
export class AppTypePermissionEntity {
  /**
   * 主键 ID
   * @description UUID 格式的主键
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 应用类型 ID
   * @description 外键，关联 sys_app_types 表
   */
  @Column({ type: 'char', length: 36, comment: '应用类型 ID - 外键关联 sys_app_types' })
  @Index()
  appTypeId: string;

  /**
   * 应用类型
   * @description 关联的应用类型对象
   */
  @ManyToOne(() => AppType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appTypeId' })
  appType: AppType;

  /**
   * 权限 ID
   * @description 外键，关联 sys_permissions 表
   */
  @Column({ type: 'char', length: 36, comment: '权限 ID - 外键关联 sys_permissions' })
  @Index()
  permissionId: string;

  /**
   * 权限
   * @description 关联的权限对象
   */
  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permissionId' })
  permission: Permission;

  /**
   * 权限值
   * @description 位运算权限值，是 Permission.permissionValue 的子集
   * 用于定义应用类型对该权限的可用操作范围
   */
  @Column({ type: 'bigint', unsigned: true, default: 0, comment: '权限值 - 位运算权限值，定义可用操作范围' })
  permissionValue: bigint;
}
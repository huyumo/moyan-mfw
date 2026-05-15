/**
 * @fileoverview 应用实例实体
 * @description 应用实例定义，存储应用的基本信息
 */

import { Entity, PrimaryGeneratedColumn, Column, Unique, Index, OneToMany } from 'typeorm';
import { Base } from '../../../../common/entities/base.entity';
import { ImageResourceDto } from '@/common';
import { toDescription, StatusDict } from '../../../../../shared';

/**
 * 应用实例实体
 * @description 应用实例表，存储系统中的应用实例信息
 */
@Entity('sys_apps')
@Unique(['appCode'])
export class App extends Base {
  /**
   * 应用实例 ID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 应用名称
   */
  @Column({ type: 'varchar', length: 128, comment: '应用名称 - 应用的中文名称' })
  appName: string;

  /**
   * 应用编码
   */
  @Column({ type: 'varchar', length: 64, comment: '应用编码 - 应用的唯一标识' })
  appCode: string;

  /**
   * 应用描述
   */
  @Column({ type: 'varchar', length: 512, nullable: true, comment: '应用描述 - 应用的详细描述' })
  appDesc: string;

  /**
   * 应用类型 ID
   */
  @Column({ type: 'char', length: 36, nullable: true, comment: '应用类型 ID - 关联应用类型表' })
  @Index()
  appTypeId: string;

  /**
   * 负责人 ID
   */
  @Column({ type: 'char', length: 36, nullable: true, comment: '负责人 ID - 应用负责人的用户 ID' })
  @Index()
  ownerId: string;

  /**
   * 应用 Logo
   */
  @Column({ type: 'json', nullable: true, comment: '应用 Logo - ImageResource 对象' })
  logo: ImageResourceDto;

  /**
   * 应用状态
   */
  @Column({ type: 'tinyint', default: StatusDict.ENABLED, comment: toDescription(StatusDict) })
  @Index()
  appStatus: number;

  /**
   * 排序号
   */
  @Column({ type: 'int', default: 0, comment: '排序号 - 数值越小越靠前' })
  sortOrder: number;
}

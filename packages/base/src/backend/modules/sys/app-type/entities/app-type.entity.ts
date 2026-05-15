/**
 * @fileoverview 应用类型实体
 * @description 应用分类/应用类型定义
 */

import { Entity, PrimaryGeneratedColumn, Column, Unique, Index, OneToMany } from 'typeorm';
import { Base } from '../../../../common/entities/base.entity';
import { ClassConstructor } from 'class-transformer';
import { toDescription, StatusDict, MultiAppEnabledDict } from '../../../../../shared';

/**
 * 应用类型实体
 * @description 应用分类表，定义系统中的应用类型
 */
@Entity('sys_app_types')
@Unique(['typeCode'])
export class AppType {
  /**
   * 应用类型 ID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 类型名称
   */
  @Column({ type: 'varchar', length: 64, comment: '类型名称 - 应用类型的中文名称' })
  typeName: string;

  /**
   * 类型编码
   */
  @Column({ type: 'varchar', length: 64, comment: '类型编码 - 应用类型的唯一标识' })
  typeCode: string;

  /**
   * 类型描述
   */
  @Column({ type: 'varchar', length: 255, nullable: true, comment: '类型描述 - 应用类型的详细描述' })
  typeDesc: string;

  /**
   * 图标
   */
  @Column({ type: 'varchar', length: 128, nullable: true, comment: '图标 URL 或图标名称' })
  icon: string;

  /**
   * 是否支持多应用
   */
  @Column({ type: 'tinyint', default: MultiAppEnabledDict.NO, comment: toDescription(MultiAppEnabledDict) })
  multiAppEnabled: number;

  /**
   * 类型状态
   */
  @Column({ type: 'tinyint', default: StatusDict.ENABLED, comment: toDescription(StatusDict) })
  @Index()
  typeStatus: number;

  /**
   * 排序
   */
  @Column({ type: 'int', default: 0, comment: '排序号 - 数值越小越靠前' })
  sortOrder: number;
}
 
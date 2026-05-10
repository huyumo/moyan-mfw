/**
 * @fileoverview 广告位类型配置实体
 * @description 定义广告位的类型和尺寸配置
 */

import { Entity, PrimaryGeneratedColumn, Column, Unique, Index, OneToMany } from 'typeorm'
import { Base } from 'moyan-base-backend'
import { toDescription, StatusDict } from 'moyan-shared-dict'
import { AdPlacement } from './ad-placement.entity'

@Entity('ext_ad_placement_types')
@Unique(['code'])
export class AdPlacementType extends Base {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 64, comment: '类型名称' })
  name: string

  @Column({ type: 'varchar', length: 64, comment: '类型编码 - 唯一标识' })
  code: string

  @Column({ type: 'int', comment: '宽度(px)' })
  width: number

  @Column({ type: 'int', comment: '高度(px)' })
  height: number

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '类型描述' })
  description: string

  @Column({ type: 'tinyint', default: StatusDict.ENABLED, comment: toDescription(StatusDict) })
  @Index()
  status: number

  @Column({ type: 'int', default: 0, comment: '排序号 - 数值越小越靠前' })
  sortOrder: number

  @OneToMany(() => AdPlacement, (p) => p.placementType)
  placements: AdPlacement[]
}

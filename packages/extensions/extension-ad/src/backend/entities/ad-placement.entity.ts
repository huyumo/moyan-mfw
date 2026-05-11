/**
 * @fileoverview 广告位实体
 * @description 定义广告位，关联广告位类型
 */

import { Entity, PrimaryGeneratedColumn, Column, Unique, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm'
import { Base } from 'moyan-base/backend'
import { toDescription, StatusDict } from 'moyan-shared-dict'
import { AdPlacementType } from './ad-placement-type.entity'
import { Ad } from './ad.entity'

@Entity('ext_ad_placements')
@Unique(['code'])
export class AdPlacement extends Base {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 64, comment: '广告位名称' })
  name: string

  @Column({ type: 'varchar', length: 64, comment: '广告位编码 - 唯一标识' })
  code: string

  @Column({ type: 'char', length: 36, comment: '广告位类型 ID' })
  placementTypeId: string

  @ManyToOne(() => AdPlacementType)
  @JoinColumn({ name: 'placementTypeId' })
  placementType: AdPlacementType

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '广告位描述' })
  description: string

  @Column({ type: 'tinyint', default: StatusDict.ENABLED, comment: toDescription(StatusDict) })
  @Index()
  status: number

  @Column({ type: 'int', default: 0, comment: '排序号 - 数值越小越靠前' })
  sortOrder: number

  @OneToMany(() => Ad, (ad) => ad.placement)
  ads: Ad[]
}

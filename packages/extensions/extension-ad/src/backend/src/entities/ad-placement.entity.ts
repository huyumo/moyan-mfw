/**
 * @fileoverview 广告位实体
 * @description 定义广告位，关联广告位类型
 */

import { Entity, PrimaryGeneratedColumn, Column, Unique, Index, OneToMany } from 'typeorm'
import { Base } from 'moyan-mfw-base/backend'
import { toDescription, StatusDict } from 'moyan-mfw-base/shared'
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

  @Column({ type: 'int', comment: '宽度(px)' })
  width: number

  @Column({ type: 'int', comment: '高度(px)' })
  height: number

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

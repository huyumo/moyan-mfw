/**
 * @fileoverview 广告内容实体
 * @description 定义广告位中的具体广告内容
 */

import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm'
import { Base, ImageResourceDto, MediaResourceDto } from 'moyan-mfw-base/backend'
import { toDescription, StatusDict } from 'moyan-mfw-base/shared'
import { AdPlacement } from './ad-placement.entity'

@Entity('ext_ad_contents')
export class Ad extends Base {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'char', length: 36, comment: '广告位 ID' })
  placementId: string

  @ManyToOne(() => AdPlacement, (p) => p.ads)
  @JoinColumn({ name: 'placementId' })
  placement: AdPlacement

  @Column({ type: 'varchar', length: 128, comment: '广告标题' })
  title: string

  @Column({
    type: 'enum',
    enum: ['image', 'video'],
    default: 'image',
    comment: '媒体类型'
  })
  mediaType: 'image' | 'video'

  @Column({
    type: 'json',
    nullable: true,
    comment: '媒体资源（图片或视频）'
  })
  media: ImageResourceDto | MediaResourceDto

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '跳转链接' })
  linkUrl: string

  @Column({ type: 'varchar', length: 32, comment: '跳转类型: miniapp | internal | external' })
  @Index()
  linkType: string

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '小程序 AppId（linkType=miniapp 时）' })
  miniAppId: string

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '小程序路径（linkType=miniapp 时）' })
  miniAppPath: string

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'App 内部路由路径（linkType=internal 时）' })
  internalRoute: string

  @Column({ type: 'datetime', nullable: true, comment: '投放开始时间' })
  startTime: Date

  @Column({ type: 'datetime', nullable: true, comment: '投放结束时间' })
  endTime: Date

  @Column({ type: 'tinyint', default: StatusDict.ENABLED, comment: toDescription(StatusDict) })
  @Index()
  status: number

  @Column({ type: 'int', default: 0, comment: '排序号 - 数值越小越靠前' })
  sortOrder: number
}

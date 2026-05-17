/**
 * @fileoverview 广告位服务
 */

import { Injectable, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AdPlacement } from '../entities/ad-placement.entity'
import { Ad } from '../entities/ad.entity'
import { CreateAdPlacementDto, UpdateAdPlacementDto, QueryAdPlacementDto } from '../dto'
import { NotFoundError, PaginationResult, PaginationX, WhereBuilder } from 'moyan-mfw-base/backend'
import { StatusDict } from 'moyan-mfw-base/shared'

@Injectable()
export class AdPlacementService {
  constructor(
    @InjectRepository(AdPlacement) private placementRepo: Repository<AdPlacement>,
  ) {}

  async create(dto: CreateAdPlacementDto): Promise<AdPlacement> {
    const existing = await this.placementRepo.findOne({ where: { code: dto.code } })
    if (existing) throw new ConflictException('广告位编码已存在')
    return this.placementRepo.save(this.placementRepo.create(dto))
  }

  async findAll(query: QueryAdPlacementDto): Promise<PaginationResult<any>> {
    const { name, code, status } = query
    const whereBuilder = new WhereBuilder()
    whereBuilder.like('p.name', name).like('p.code', code).eq('p.status', status).isNull('p.deleteAt')

    const pager = new PaginationX(this.placementRepo.manager.connection as any, query)
    const result = await pager.where('main', whereBuilder)
      .sql(({ select, wheres, orderBy, limit }) => {
        const whereClause = wheres?.main || ''
        return `
          WITH ad_agg AS (
            SELECT
              a.placementId,
              JSON_ARRAYAGG(
                JSON_OBJECT(
                  'id', a.id,
                  'title', a.title,
                  'mediaType', a.mediaType,
                  'media', a.media
                )
              ) AS ads,
              COUNT(*) AS adCount
            FROM (
              SELECT *, ROW_NUMBER() OVER (
                PARTITION BY placementId
                ORDER BY sortOrder ASC, createdAt DESC
              ) AS rn
              FROM ext_ad_contents
              WHERE status = ${StatusDict.ENABLED} AND deleteAt IS NULL
            ) a
            WHERE a.rn <= 10
            GROUP BY a.placementId
          )
          SELECT
            ${select}
          FROM ext_ad_placements p
          LEFT JOIN ad_agg ON ad_agg.placementId = p.id
          ${whereClause}
          ${orderBy}
          ${limit}
        `
      })
      .select('p.*, COALESCE(ad_agg.ads, JSON_ARRAY()) AS ads, COALESCE(ad_agg.adCount, 0) AS adCount')
      .defaultOrderBy('p.sortOrder ASC, p.createdAt DESC')
      .getData()

    if (result.list?.length) {
      result.list = result.list.map((item: any) => ({
        ...item,
        ads: typeof item.ads === 'string' ? JSON.parse(item.ads) : (item.ads || []),
        adCount: Number(item.adCount) || 0,
      }))
    }

    return result
  }

  async findById(id: string): Promise<AdPlacement> {
    const entity = await this.placementRepo.findOne({ where: { id } })
    if (!entity) throw new NotFoundError('广告位')
    return entity
  }

  async update(id: string, dto: UpdateAdPlacementDto): Promise<AdPlacement> {
    const entity = await this.findById(id)
    if (dto.code && dto.code !== entity.code) {
      const existing = await this.placementRepo.findOne({ where: { code: dto.code } })
      if (existing) throw new ConflictException('广告位编码已存在')
    }
    Object.assign(entity, dto)
    return this.placementRepo.save(entity)
  }

  async delete(id: string): Promise<void> {
    const entity = await this.findById(id)
    const childCount = await this.placementRepo.manager
      .getRepository(Ad).count({ where: { placementId: id } })
    if (childCount > 0) {
      throw new ConflictException(`该广告位下有 ${childCount} 条广告内容，请先删除关联广告内容`)
    }
    await this.placementRepo.softDelete(entity.id)
  }

  /**
   * 按编码查询广告位及有效广告（公开接口，无需登录）
   * @returns 广告位信息 + 当前有效的广告列表
   */
  async findByCodeWithAds(code: string): Promise<AdPlacement & { ads: Ad[] }> {
    const placement = await this.placementRepo.findOne({
      where: { code, status: StatusDict.ENABLED },
    })
    if (!placement) throw new NotFoundError('广告位')

    const now = new Date()
    const ads = await this.placementRepo.manager.getRepository(Ad).find({
      where: { placementId: placement.id, status: StatusDict.ENABLED },
      order: { sortOrder: 'ASC' },
    })

    const validAds = ads.filter((ad) => {
      if (ad.startTime && ad.startTime > now) return false
      if (ad.endTime && ad.endTime < now) return false
      return true
    })

    return { ...placement, ads: validAds }
  }
}

/**
 * @fileoverview 广告位服务
 */

import { Injectable, ConflictException } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { DataSource, Repository } from 'typeorm'
import { AdPlacement } from '../entities/ad-placement.entity'
import { Ad } from '../entities/ad.entity'
import { CreateAdPlacementDto, UpdateAdPlacementDto, QueryAdPlacementDto } from '../dto'
import { NotFoundError, PaginationResult, PaginationX, WhereBuilder } from 'moyan-base-backend'

@Injectable()
export class AdPlacementService {
  private ds: DataSource

  constructor(private moduleRef: ModuleRef) {
    this.ds = this.moduleRef.get(DataSource, { strict: false })
  }

  private get placementRepo(): Repository<AdPlacement> {
    return this.ds.getRepository(AdPlacement)
  }

  async create(dto: CreateAdPlacementDto): Promise<AdPlacement> {
    const repo = this.placementRepo
    const existing = await repo.findOne({ where: { code: dto.code } })
    if (existing) throw new ConflictException('广告位编码已存在')
    return repo.save(repo.create(dto))
  }

  async findAll(query: QueryAdPlacementDto): Promise<PaginationResult<any>> {
    const { name, code, placementTypeId, status } = query
    const whereBuilder = new WhereBuilder()
    whereBuilder.like('p.name', name).like('p.code', code)
      .eq('p.placementTypeId', placementTypeId).eq('p.status', status)
    const pager = new PaginationX(this.ds, query)
    const result = await pager.where('main', whereBuilder)
      .sql(({ select, wheres, orderBy, limit }) => {
        const whereClause = wheres?.main || ''
        return `SELECT ${select} FROM ext_ad_placements p LEFT JOIN ext_ad_placement_types t ON p.placementTypeId = t.id ${whereClause} ${orderBy} ${limit}`
      }).select(`p.*, JSON_OBJECT('id', t.id, 'name', t.name, 'code', t.code, 'width', t.width, 'height', t.height) as placementType`)
      .defaultOrderBy('p.sortOrder ASC, p.createdAt DESC').getData()
    if (result.data?.length) {
      result.data = result.data.map((item: any) => ({
        ...item,
        placementType: item.placementType ? JSON.parse(item.placementType) : null,
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
    const repo = this.placementRepo
    const entity = await this.findById(id)
    if (dto.code && dto.code !== entity.code) {
      const existing = await repo.findOne({ where: { code: dto.code } })
      if (existing) throw new ConflictException('广告位编码已存在')
    }
    Object.assign(entity, dto)
    return repo.save(entity)
  }

  async delete(id: string): Promise<void> {
    const repo = this.placementRepo
    const entity = await this.findById(id)
    const childCount = await this.ds
      .getRepository(Ad).count({ where: { placementId: id } })
    if (childCount > 0) {
      throw new ConflictException(`该广告位下有 ${childCount} 条广告内容，请先删除关联广告内容`)
    }
    await repo.softDelete(entity.id)
  }
}

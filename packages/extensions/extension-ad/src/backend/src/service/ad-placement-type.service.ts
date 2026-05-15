/**
 * @fileoverview 广告位类型配置服务
 */

import { Injectable, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AdPlacementType } from '../../entities/ad-placement-type.entity'
import { AdPlacement } from '../../entities/ad-placement.entity'
import { CreateAdPlacementTypeDto, UpdateAdPlacementTypeDto, QueryAdPlacementTypeDto } from '../../dto'
import { NotFoundError, PaginationResult, PaginationX, WhereBuilder } from 'moyan-mfw-base/backend'

@Injectable()
export class AdPlacementTypeService {
  constructor(
    @InjectRepository(AdPlacementType) private typeRepo: Repository<AdPlacementType>,
  ) {}

  async create(dto: CreateAdPlacementTypeDto): Promise<AdPlacementType> {
    const existing = await this.typeRepo.findOne({ where: { code: dto.code } })
    if (existing) throw new ConflictException('类型编码已存在')
    return this.typeRepo.save(this.typeRepo.create(dto))
  }

  async findAll(query: QueryAdPlacementTypeDto): Promise<PaginationResult<any>> {
    const { name, code, status } = query
    const whereBuilder = new WhereBuilder()
    whereBuilder.like('t.name', name).like('t.code', code).eq('t.status', status)
    const pager = new PaginationX(this.typeRepo.manager.connection as any, query)
    return pager.where('main', whereBuilder)
      .sql(({ select, wheres, orderBy, limit }) => {
        const whereClause = wheres?.main || ''
        return `SELECT ${select} FROM ext_ad_placement_types t ${whereClause} ${orderBy} ${limit}`
      }).select('t.*').defaultOrderBy('t.sortOrder ASC, t.createdAt DESC').getData()
  }

  async findById(id: string): Promise<AdPlacementType> {
    const entity = await this.typeRepo.findOne({ where: { id } })
    if (!entity) throw new NotFoundError('广告位类型配置')
    return entity
  }

  async update(id: string, dto: UpdateAdPlacementTypeDto): Promise<AdPlacementType> {
    const entity = await this.findById(id)
    if (dto.code && dto.code !== entity.code) {
      const existing = await this.typeRepo.findOne({ where: { code: dto.code } })
      if (existing) throw new ConflictException('类型编码已存在')
    }
    Object.assign(entity, dto)
    return this.typeRepo.save(entity)
  }

  async delete(id: string): Promise<void> {
    const entity = await this.findById(id)
    const childCount = await this.typeRepo.manager
      .getRepository(AdPlacement).count({ where: { placementTypeId: id } })
    if (childCount > 0) {
      throw new ConflictException(`该类型下有 ${childCount} 个广告位，请先删除关联广告位`)
    }
    await this.typeRepo.softDelete(entity.id)
  }
}

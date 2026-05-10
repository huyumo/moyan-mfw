/**
 * @fileoverview 广告位服务
 * @description 处理广告位相关业务逻辑
 */

import { Injectable, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { AdPlacement } from '../entities/ad-placement.entity'
import { CreateAdPlacementDto, UpdateAdPlacementDto, QueryAdPlacementDto } from '../dto'
import { NotFoundError, PaginationResult, PaginationX, WhereBuilder } from 'moyan-base-backend'

@Injectable()
export class AdPlacementService {
  constructor(
    @InjectRepository(AdPlacement)
    private placementRepo: Repository<AdPlacement>,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateAdPlacementDto): Promise<AdPlacement> {
    const existing = await this.placementRepo.findOne({ where: { code: dto.code } })
    if (existing) throw new ConflictException('广告位编码已存在')

    const entity = this.placementRepo.create(dto)
    return this.dataSource.transaction(async (manager) => {
      return manager.save(entity)
    })
  }

  async findAll(query: QueryAdPlacementDto): Promise<PaginationResult<any>> {
    const { name, code, placementTypeId, status } = query
    const whereBuilder = new WhereBuilder()
    whereBuilder
      .like('p.name', name)
      .like('p.code', code)
      .eq('p.placementTypeId', placementTypeId)
      .eq('p.status', status)

    const pager = new PaginationX(this.dataSource, query)
    const result = await pager
      .where('main', whereBuilder)
      .sql(({ select, wheres, orderBy, limit }) => {
        const whereClause = wheres?.main || ''
        return `SELECT ${select} FROM ext_ad_placements p LEFT JOIN ext_ad_placement_types t ON p.placementTypeId = t.id ${whereClause} ${orderBy} ${limit}`
      })
      .select(`p.*, 
        JSON_OBJECT('id', t.id, 'name', t.name, 'code', t.code, 'width', t.width, 'height', t.height) as placementType`)
      .defaultOrderBy('p.sortOrder ASC, p.createdAt DESC')
      .getData()

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
    await this.placementRepo.softDelete(entity.id)
  }
}

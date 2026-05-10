/**
 * @fileoverview 广告位类型配置服务
 * @description 处理广告位类型配置相关业务逻辑
 */

import { Injectable, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { AdPlacementType } from '../entities/ad-placement-type.entity'
import { CreateAdPlacementTypeDto, UpdateAdPlacementTypeDto, QueryAdPlacementTypeDto } from '../dto'
import { NotFoundError, PaginationResult, PaginationX, WhereBuilder } from 'moyan-base-backend'

@Injectable()
export class AdPlacementTypeService {
  constructor(
    @InjectRepository(AdPlacementType)
    private typeRepo: Repository<AdPlacementType>,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateAdPlacementTypeDto): Promise<AdPlacementType> {
    const existing = await this.typeRepo.findOne({ where: { code: dto.code } })
    if (existing) throw new ConflictException('类型编码已存在')

    const entity = this.typeRepo.create(dto)
    return this.dataSource.transaction(async (manager) => {
      return manager.save(entity)
    })
  }

  async findAll(query: QueryAdPlacementTypeDto): Promise<PaginationResult<AdPlacementType>> {
    const { name, code, status } = query
    const whereBuilder = new WhereBuilder()
    whereBuilder
      .like('t.name', name)
      .like('t.code', code)
      .eq('t.status', status)

    const pager = new PaginationX(this.dataSource, query)
    return pager
      .where('main', whereBuilder)
      .sql(({ select, wheres, orderBy, limit }) => {
        const whereClause = wheres?.main || ''
        return `SELECT ${select} FROM ext_ad_placement_types t ${whereClause} ${orderBy} ${limit}`
      })
      .select('t.*')
      .defaultOrderBy('t.sortOrder ASC, t.createdAt DESC')
      .getData()
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
    await this.typeRepo.softDelete(entity.id)
  }
}

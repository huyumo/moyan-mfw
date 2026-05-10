/**
 * @fileoverview 广告内容服务
 * @description 处理广告内容相关业务逻辑
 */

import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { Ad } from '../entities/ad.entity'
import { CreateAdDto, UpdateAdDto, QueryAdDto } from '../dto'
import { NotFoundError, PaginationResult, PaginationX, WhereBuilder } from 'moyan-base-backend'

@Injectable()
export class AdService {
  constructor(
    @InjectRepository(Ad)
    private adRepo: Repository<Ad>,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateAdDto): Promise<Ad> {
    const entity = this.adRepo.create(dto)
    return this.dataSource.transaction(async (manager) => {
      return manager.save(entity)
    })
  }

  async findAll(query: QueryAdDto): Promise<PaginationResult<any>> {
    const { placementId, title, linkType, status } = query
    const whereBuilder = new WhereBuilder()
    whereBuilder
      .eq('a.placementId', placementId)
      .like('a.title', title)
      .eq('a.linkType', linkType)
      .eq('a.status', status)

    const pager = new PaginationX(this.dataSource, query)
    const result = await pager
      .where('main', whereBuilder)
      .sql(({ select, wheres, orderBy, limit }) => {
        const whereClause = wheres?.main || ''
        return `SELECT ${select} FROM ext_ad_contents a LEFT JOIN ext_ad_placements p ON a.placementId = p.id ${whereClause} ${orderBy} ${limit}`
      })
      .select(`a.*, JSON_OBJECT('id', p.id, 'name', p.name, 'code', p.code) as placement`)
      .defaultOrderBy('a.sortOrder ASC, a.createdAt DESC')
      .getData()

    if (result.data?.length) {
      result.data = result.data.map((item: any) => ({
        ...item,
        placement: item.placement ? JSON.parse(item.placement) : null,
      }))
    }
    return result
  }

  async findById(id: string): Promise<Ad> {
    const entity = await this.adRepo.findOne({ where: { id } })
    if (!entity) throw new NotFoundError('广告内容')
    return entity
  }

  async update(id: string, dto: UpdateAdDto): Promise<Ad> {
    const entity = await this.findById(id)
    Object.assign(entity, dto)
    return this.adRepo.save(entity)
  }

  async delete(id: string): Promise<void> {
    const entity = await this.findById(id)
    await this.adRepo.softDelete(entity.id)
  }
}

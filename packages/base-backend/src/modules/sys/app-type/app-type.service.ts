/**
 * @fileoverview 应用类型服务
 * @description 处理应用类型相关业务逻辑
 */

import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AppType } from './entities/app-type.entity';
import { CreateAppTypeDto, UpdateAppTypeDto, QueryAppTypeDto } from './dto';
import { NotFoundError } from '../../../common/exceptions/not-found.exception';
import { PaginationHelper, PaginationResult, QueryBuilderHelper } from '../../../common';

/**
 * 应用类型服务
 */
@Injectable()
export class AppTypeService {
  constructor(
    @InjectRepository(AppType)
    private appTypeRepository: Repository<AppType>,
    private dataSource: DataSource,
  ) {}

  /**
   * 创建应用类型
   * @param createAppTypeDto - 创建应用类型请求参数
   * @returns 创建的应用类型
   */
  async create(createAppTypeDto: CreateAppTypeDto): Promise<AppType> {
    const { typeCode } = createAppTypeDto;

    // 检查类型编码是否存在
    const existingAppType = await this.appTypeRepository.findOne({
      where: { typeCode },
    });

    if (existingAppType) {
      throw new ConflictException('类型编码已存在');
    }

    // 创建应用类型
    const appType = this.appTypeRepository.create(createAppTypeDto);
    return this.appTypeRepository.save(appType);
  }

  /**
   * 根据 ID 查询应用类型
   * @param id - 应用类型 ID
   * @returns 应用类型信息
   */
  async findById(id: string): Promise<AppType> {
    const appType = await this.appTypeRepository.findOne({
      where: { id },
    });

    if (!appType) {
      throw new NotFoundError('应用类型');
    }

    return appType;
  }

  /**
   * 查询应用类型列表（分页）
   * @param query - 查询参数
   * @returns 分页结果
   */
  async findAll(query: QueryAppTypeDto): Promise<PaginationResult<AppType>> {
    const qb = this.appTypeRepository.createQueryBuilder('appType');

    // 使用 QueryBuilderHelper 构建查询条件（支持 10+ 条件不臃肿）
    QueryBuilderHelper.applyConditions(qb, [
      { field: 'appType.typeName', value: query.typeName, operator: 'like' },
      { field: 'appType.typeCode', value: query.typeCode, operator: 'like' },
      { field: 'appType.typeStatus', value: query.typeStatus, operator: '=' },
    ]);

    // 使用 PaginationHelper 执行分页查询
    return PaginationHelper.executeQuery(
      qb.orderBy('appType.sortOrder', 'ASC').addOrderBy('appType.createdAt', 'DESC'),
      query,
    );
  }

  /**
   * 查询所有应用类型
   * @returns 应用类型列表
   */
  async findAllList(): Promise<AppType[]> {
    return this.appTypeRepository.find({
      order: {
        sortOrder: 'ASC',
        createdAt: 'DESC',
      },
    });
  }

  /**
   * 更新应用类型
   * @param id - 应用类型 ID
   * @param updateAppTypeDto - 更新应用类型请求参数
   * @returns 更新后的应用类型
   */
  async update(id: string, updateAppTypeDto: UpdateAppTypeDto): Promise<AppType> {
    // 查找应用类型
    const appType = await this.appTypeRepository.findOne({
      where: { id },
    });

    if (!appType) {
      throw new NotFoundError('应用类型');
    }

    // 如果更新类型编码，检查是否重复
    if (updateAppTypeDto.typeCode && updateAppTypeDto.typeCode !== appType.typeCode) {
      const existingAppType = await this.appTypeRepository.findOne({
        where: { typeCode: updateAppTypeDto.typeCode },
      });

      if (existingAppType) {
        throw new ConflictException('类型编码已存在');
      }
    }

    // 更新应用类型信息
    Object.assign(appType, updateAppTypeDto);
    return this.appTypeRepository.save(appType);
  }

  /**
   * 删除应用类型
   * @param id - 应用类型 ID
   */
  async delete(id: string): Promise<void> {
    const appType = await this.appTypeRepository.findOne({
      where: { id },
    });

    if (!appType) {
      throw new NotFoundError('应用类型');
    }

    // 使用软删除
    await this.appTypeRepository.softDelete(id);
  }

  /**
   * 更新应用类型状态
   * @param id - 应用类型 ID
   * @param status - 新状态
   * @returns 更新后的应用类型
   */
  async updateStatus(id: string, status: number): Promise<AppType> {
    const appType = await this.appTypeRepository.findOne({
      where: { id },
    });

    if (!appType) {
      throw new NotFoundError('应用类型');
    }

    appType.typeStatus = status;
    return this.appTypeRepository.save(appType);
  }
}

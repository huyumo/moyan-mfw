/**
 * @fileoverview 应用服务
 * @description 处理应用实例相关业务逻辑
 */

import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { App } from '../entities/app.entity';
import { CreateAppDto, UpdateAppDto, QueryAppDto } from '../dto';
import { NotFoundError } from '../../../../common/exceptions/not-found.exception';
import { PaginationHelper, PaginationResult, QueryBuilderHelper } from '../../../../common';

/**
 * 应用服务
 */
@Injectable()
export class AppService {
  constructor(
    @InjectRepository(App)
    private appRepository: Repository<App>,
    private dataSource: DataSource,
  ) {}

  /**
   * 创建应用实例
   * @param createAppDto - 创建应用实例请求参数
   * @returns 创建的应用实例
   */
  async create(createAppDto: CreateAppDto): Promise<App> {
    const { appCode } = createAppDto;

    // 检查应用编码是否存在
    const existingApp = await this.appRepository.findOne({
      where: { appCode },
    });

    if (existingApp) {
      throw new ConflictException('应用编码已存在');
    }

    // 创建应用实例
    const app = this.appRepository.create(createAppDto);
    return this.appRepository.save(app);
  }

  /**
   * 根据 ID 查询应用实例
   * @param id - 应用实例 ID
   * @returns 应用实例信息
   */
  async findById(id: string): Promise<App> {
    const app = await this.appRepository.findOne({
      where: { id },
    });

    if (!app) {
      throw new NotFoundError('应用实例');
    }

    return app;
  }

  /**
   * 查询应用实例列表（分页）
   * @param query - 查询参数
   * @returns 分页结果
   */
  async findAll(query: QueryAppDto): Promise<PaginationResult<App>> {
    const qb = this.appRepository.createQueryBuilder('app');

    // 使用 QueryBuilderHelper 构建查询条件
    QueryBuilderHelper.applyConditions(qb, [
      { field: 'app.appName', value: query.appName, operator: 'like' },
      { field: 'app.appCode', value: query.appCode, operator: 'like' },
      { field: 'app.appTypeId', value: query.appTypeId, operator: '=' },
      { field: 'app.ownerId', value: query.ownerId, operator: '=' },
      { field: 'app.appStatus', value: query.appStatus, operator: '=' },
    ]);

    // 使用 PaginationHelper 执行分页查询
    return PaginationHelper.executeQuery(
      qb.orderBy('app.sortOrder', 'ASC').addOrderBy('app.createdAt', 'DESC'),
      query,
    );
  }

  /**
   * 更新应用实例
   * @param id - 应用实例 ID
   * @param updateAppDto - 更新应用实例请求参数
   * @returns 更新后的应用实例
   */
  async update(id: string, updateAppDto: UpdateAppDto): Promise<App> {
    // 查找应用实例
    const app = await this.appRepository.findOne({
      where: { id },
    });

    if (!app) {
      throw new NotFoundError('应用实例');
    }

    // 如果更新应用编码，检查是否重复
    if (updateAppDto.appCode && updateAppDto.appCode !== app.appCode) {
      const existingApp = await this.appRepository.findOne({
        where: { appCode: updateAppDto.appCode },
      });

      if (existingApp) {
        throw new ConflictException('应用编码已存在');
      }
    }

    // 更新应用实例信息
    Object.assign(app, updateAppDto);
    return this.appRepository.save(app);
  }

  /**
   * 删除应用实例
   * @param id - 应用实例 ID
   */
  async delete(id: string): Promise<void> {
    const app = await this.appRepository.findOne({
      where: { id },
    });

    if (!app) {
      throw new NotFoundError('应用实例');
    }

    // 使用软删除
    await this.appRepository.softDelete(id);
  }

  /**
   * 变更负责人
   * @param id - 应用实例 ID
   * @param ownerId - 新负责人 ID
   * @returns 更新后的应用实例
   */
  async changeOwner(id: string, ownerId: string): Promise<App> {
    const app = await this.appRepository.findOne({
      where: { id },
    });

    if (!app) {
      throw new NotFoundError('应用实例');
    }

    app.ownerId = ownerId;
    return this.appRepository.save(app);
  }

  /**
   * 更新应用实例状态
   * @param id - 应用实例 ID
   * @param status - 新状态
   * @returns 更新后的应用实例
   */
  async updateStatus(id: string, status: number): Promise<App> {
    const app = await this.appRepository.findOne({
      where: { id },
    });

    if (!app) {
      throw new NotFoundError('应用实例');
    }

    app.appStatus = status;
    return this.appRepository.save(app);
  }
}

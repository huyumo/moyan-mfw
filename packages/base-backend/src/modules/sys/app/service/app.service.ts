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
import { PaginationResult, PaginationX, WhereBuilder } from '../../../../common';

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
  async findById(id: string): Promise<any> {
    const app = await this.appRepository.findOne({
      where: { id },
    });

    if (!app) {
      throw new NotFoundError('应用实例');
    }

    const result = { ...app };

    if (app.appTypeId) {
      const appType = await this.dataSource.query(
        `SELECT id, typeName, typeCode FROM sys_app_types WHERE id = ? AND deleteAt IS NULL`,
        [app.appTypeId]
      );
      result.appType = appType[0] || null;
    }

    if (app.ownerId) {
      const owner = await this.dataSource.query(
        `SELECT id, username, nickname, avatar FROM sys_users WHERE id = ? AND deleteAt IS NULL`,
        [app.ownerId]
      );
      result.owner = owner[0] || null;
    }

    return result;
  }

  /**
   * 查询应用实例列表（分页）
   * @param query - 查询参数
   * @returns 分页结果
   */
  async findAll(query: QueryAppDto): Promise<PaginationResult<any>> {
    const { appName, appCode, appTypeId, ownerId, appStatus } = query;
    const whereBuilder = new WhereBuilder();
    whereBuilder
      .like('app.appName', appName)
      .like('app.appCode', appCode)
      .eq('app.appTypeId', appTypeId)
      .eq('app.ownerId', ownerId)
      .eq('app.appStatus', appStatus);

    const pager = new PaginationX(this.dataSource, query);
    const result = await pager
      .where('main', whereBuilder)
      .sql(({ select, wheres, orderBy, limit }) => {
        const whereClause = wheres?.main || '';
        return `SELECT ${select} FROM sys_apps app ${whereClause} ${orderBy} ${limit}`;
      })
      .select('app.*')
      .defaultOrderBy('app.sortOrder ASC, app.createdAt DESC')
      .getData();

    if (result.data && result.data.length > 0) {
      const appTypeIds = result.data.filter((item: any) => item.appTypeId).map((item: any) => item.appTypeId);
      const ownerIds = result.data.filter((item: any) => item.ownerId).map((item: any) => item.ownerId);

      let appTypes: any[] = [];
      let owners: any[] = [];

      if (appTypeIds.length > 0) {
        appTypes = await this.dataSource.query(
          `SELECT id, typeName, typeCode FROM sys_app_types WHERE id IN (?) AND deleteAt IS NULL`,
          [appTypeIds]
        );
      }

      if (ownerIds.length > 0) {
        owners = await this.dataSource.query(
          `SELECT id, username, nickname, avatar FROM sys_users WHERE id IN (?) AND deleteAt IS NULL`,
          [ownerIds]
        );
      }

      const appTypeMap = new Map(appTypes.map((t: any) => [t.id, t]));
      const ownerMap = new Map(owners.map((o: any) => [o.id, o]));

      result.data = result.data.map((item: any) => ({
        ...item,
        appType: appTypeMap.get(item.appTypeId) || null,
        owner: ownerMap.get(item.ownerId) || null,
      }));
    }

    return result;
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

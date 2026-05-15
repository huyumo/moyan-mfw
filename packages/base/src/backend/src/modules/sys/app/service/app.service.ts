/**
 * @fileoverview 应用服务
 * @description 处理应用实例相关业务逻辑
 */

import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { randomUUID } from 'crypto';
import { App } from '../../entities/app.entity';
import { CreateAppDto, UpdateAppDto, QueryAppDto } from '../../dto';
import { NotFoundError } from '../../../../../common/exceptions/not-found.exception';
import { PaginationResult, PaginationX, WhereBuilder } from '../../../../../common';

/**
 * 应用服务
 */
@Injectable()
export class AppService {
  constructor(
    @InjectRepository(App)
    private appRepository: Repository<App>,
    private dataSource: DataSource,

  ) { }

  /**
   * 创建应用实例
   * @param createAppDto - 创建应用实例请求参数
   * @returns 创建的应用实例
   */
  async create(createAppDto: CreateAppDto): Promise<App> {
    const { appCode } = createAppDto;

    const existingApp = await this.appRepository.findOne({
      where: { appCode },
    });

    if (existingApp) {
      throw new ConflictException('应用编码已存在');
    }

    const app = this.appRepository.create(createAppDto);
    return this.appRepository.save(app);
  }

  /**
   * 根据 ID 查询应用实例
   * @param id - 应用实例 ID
   * @returns 应用实例信息
   */
  async findById(id: string): Promise<any> {
    const result = await this.dataSource.query(
      `SELECT 
        app.*,
        JSON_OBJECT('id', t.id, 'typeName', t.typeName, 'typeCode', t.typeCode) as appType,
        JSON_OBJECT('id', u.id, 'username', u.username, 'nickname', u.nickname, 'avatar', u.avatar) as owner
      FROM sys_apps app
      LEFT JOIN sys_app_types t ON app.appTypeId = t.id
      LEFT JOIN sys_users u ON app.ownerId = u.id AND u.deleteAt IS NULL
      WHERE app.id = ? AND app.deleteAt IS NULL`,
      [id]
    );

    if (!result || result.length === 0) {
      throw new NotFoundError('应用实例');
    }

    const app = result[0];
    return {
      ...app,
      appType: app.appType,
      owner: app.owner,
    };
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
        return `SELECT ${select} FROM sys_apps app LEFT JOIN sys_app_types t ON app.appTypeId = t.id LEFT JOIN sys_users u ON app.ownerId = u.id ${whereClause} ${orderBy} ${limit}`;
      })
      .select(`app.*, 
        JSON_OBJECT('id', t.id, 'typeName', t.typeName, 'typeCode', t.typeCode) as appType,
        JSON_OBJECT('id', u.id, 'username', u.username, 'nickname', u.nickname, 'avatar', u.avatar) as owner`)
      .defaultOrderBy('app.sortOrder ASC, app.createdAt DESC')
      .getData();

    if (result.data && result.data.length > 0) {
      result.data = result.data.map((item: any) => ({
        ...item,
        appType: item.appType ? JSON.parse(item.appType) : null,
        owner: item.owner ? JSON.parse(item.owner) : null,
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

    if (app.appCode === 'system-instance') {
      throw new BadRequestException('系统内置应用不可删除');
    }

    // 使用软删除
    await this.appRepository.softDelete(id);
  }

  /**
   * 变更负责人
   * @description 完整移交应用所有权：移除原拥有者的成员身份和角色，为新拥有者分配拥有者权限
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

    if (app.appCode === 'system-instance') {
      throw new BadRequestException('系统内置应用不可更换拥有者');
    }

    if (app.ownerId === ownerId) {
      return app;
    }

    const oldOwnerId = app.ownerId;

    await this.dataSource.transaction(async (manager) => {
      const users = await manager.query(
        `SELECT id FROM sys_users WHERE id = ? AND deleteAt IS NULL`,
        [ownerId],
      );
      if (!users || users.length === 0) {
        throw new BadRequestException('用户不存在');
      }

      const ownerRoles: { id: string }[] = await manager.query(
        `SELECT id FROM sys_roles WHERE isOwner = 1 AND (appId = ? OR appTypeId = ?)`,
        [app.id, app.appTypeId],
      );

      if (oldOwnerId) {
        await manager.query(
          `DELETE FROM sys_user_roles WHERE userId = ? AND appId = ?`,
          [oldOwnerId, app.id],
        );
        await manager.query(
          `DELETE FROM sys_app_members WHERE userId = ? AND appId = ?`,
          [oldOwnerId, app.id],
        );
      }

      app.ownerId = ownerId;
      await manager.save(app);

      await manager.query(
        `INSERT IGNORE INTO sys_app_members (id, appId, userId, createdAt, updateAt)
         VALUES (UUID(), ?, ?, NOW(), NOW())`,
        [app.id, ownerId],
      );

      if (ownerRoles.length > 0) {
        const insertValues = ownerRoles.map((r) => [
          randomUUID(),
          ownerId,
          r.id,
          app.id,
        ]);
        await manager.query(
          `INSERT IGNORE INTO sys_user_roles (id, userId, roleId, appId) VALUES ?`,
          [insertValues],
        );
      }
    });

    return app;
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

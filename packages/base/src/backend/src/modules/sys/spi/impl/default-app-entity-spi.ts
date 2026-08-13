/**
 * @fileoverview 应用实体 SPI 默认实现
 * @description 委托 AppService / AppTypeService 实现应用实体同步逻辑。
 * 业务方可直接注入 AppEntitySpi 抽象类使用，或继承本类覆盖个别方法。
 * 注：使用全局 DataSource 获取 repository，避免跨模块注入 forFeature 的 repository provider。
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  AppEntitySpi,
  CreateAppSpiInput,
  UpdateAppSpiInput,
  AppSpiResult,
} from '../abstractions/app-entity-spi';
import { AppService } from '../../app/service/app.service';
import { AppType } from '../../app-type/entities/app-type.entity';
import { App } from '../../app/entities/app.entity';

/**
 * 应用实体 SPI 默认实现
 */
@Injectable()
export class DefaultAppEntitySpi extends AppEntitySpi {
  constructor(
    private appService: AppService,
    @InjectDataSource() private dataSource: DataSource,
  ) {
    super();
  }

  async createApp(input: CreateAppSpiInput): Promise<AppSpiResult> {
    const { appTypeId, appTypeCode, ownerId, ...rest } = input;

    const resolvedTypeId = await this.resolveAppTypeId(appTypeId, appTypeCode);

    const app = await this.appService.create({
      ...rest,
      appTypeId: resolvedTypeId,
    } as any);

    // 需要绑定拥有者时，复用框架的完整 owner 绑定逻辑（成员记录 + owner 角色分配）
    if (ownerId) {
      await this.appService.changeOwner(app.id, ownerId);
    }

    return this.getApp(app.id);
  }

  async updateApp(appId: string, input: UpdateAppSpiInput): Promise<AppSpiResult> {
    const app = await this.appService.update(appId, input as any);
    return this.toResult(app);
  }

  async disableApp(appId: string): Promise<AppSpiResult> {
    const app = await this.appService.updateStatus(appId, 0);
    return this.toResult(app);
  }

  async enableApp(appId: string): Promise<AppSpiResult> {
    const app = await this.appService.updateStatus(appId, 1);
    return this.toResult(app);
  }

  async deleteApp(appId: string): Promise<void> {
    await this.appService.delete(appId);
  }

  async changeAppOwner(appId: string, ownerId: string): Promise<AppSpiResult> {
    const app = await this.appService.changeOwner(appId, ownerId);
    return this.toResult(app);
  }

  async getApp(appId: string): Promise<AppSpiResult> {
    return this.appService.findById(appId);
  }

  async findAppByCode(appCode: string): Promise<AppSpiResult | null> {
    const app = await this.dataSource
      .getRepository(App)
      .findOne({ where: { appCode } });
    return app ? this.toResult(app) : null;
  }

  /**
   * 解析应用类型 ID：优先 appTypeId，否则按 appTypeCode 查询
   */
  private async resolveAppTypeId(
    appTypeId?: string,
    appTypeCode?: string,
  ): Promise<string> {
    if (appTypeId) return appTypeId;

    if (appTypeCode) {
      const appType = await this.dataSource
        .getRepository(AppType)
        .findOne({ where: { typeCode: appTypeCode } });
      if (appType) return appType.id;
      throw new BadRequestException(`应用类型编码 ${appTypeCode} 不存在`);
    }

    throw new BadRequestException('应用类型 ID 或编码不能为空');
  }

  private toResult(app: App): AppSpiResult {
    return app as unknown as AppSpiResult;
  }
}

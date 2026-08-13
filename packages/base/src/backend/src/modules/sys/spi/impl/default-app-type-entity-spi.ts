/**
 * @fileoverview 应用类型实体 SPI 默认实现
 * @description 提供应用类型只读查询。业务方可直接注入 AppTypeEntitySpi 抽象类使用。
 * 注：使用全局 DataSource 获取 repository，避免跨模块注入 forFeature 的 repository provider。
 */

import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppTypeEntitySpi } from '../abstractions/app-type-entity-spi';
import { AppType } from '../../app-type/entities/app-type.entity';

/**
 * 应用类型实体 SPI 默认实现（只读）
 */
@Injectable()
export class DefaultAppTypeEntitySpi extends AppTypeEntitySpi {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super();
  }

  async findById(appTypeId: string): Promise<AppType | null> {
    return this.dataSource
      .getRepository(AppType)
      .findOne({ where: { id: appTypeId } });
  }

  async findByCode(typeCode: string): Promise<AppType | null> {
    return this.dataSource
      .getRepository(AppType)
      .findOne({ where: { typeCode } });
  }

  async findAll(): Promise<AppType[]> {
    return this.dataSource.getRepository(AppType).find();
  }
}

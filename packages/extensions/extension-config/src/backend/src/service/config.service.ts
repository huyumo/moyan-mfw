/**
 * @fileoverview 配置管理服务
 * @description 提供配置的 CRUD 操作，支持缓存和事务
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource, Repository, FindOptionsWhere } from 'typeorm';
import { Cacheable, CacheEvict } from 'moyan-mfw-base/backend';
import { Config } from '../entities/config.entity';
import { BatchUpdateConfigDto, CreateConfigDto } from '../dto';
import { ConfigType } from '@internal/config-shared';

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(Config)
    private readonly repo: Repository<Config>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Cacheable({ key: 'config:{appId}:{groupKey}', ttl: 3600 })
  async getByGroup(appId: number | null, groupKey: string): Promise<Config[]> {
    const where: FindOptionsWhere<Config> = { groupKey };
    if (appId !== null) {
      where.appId = appId;
    }
    return this.repo.find({ where });
  }

  @Cacheable({ key: 'config:pub:{groupKey}', ttl: 3600 })
  async getPublicByGroup(groupKey: string): Promise<Config[]> {
    return this.repo.find({ where: { groupKey, configType: ConfigType.PUBLIC } });
  }

  @CacheEvict({ keys: 'config:{appId}:{groupKey}' })
  async batchUpdate(appId: number | null, groupKey: string, dto: BatchUpdateConfigDto): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const where: FindOptionsWhere<Config> = appId !== null ? { groupKey, appId } : { groupKey };
      const existingConfigs = await manager.find(Config, {
        where,
        select: ['id', 'configKey', 'configType'],
      });
      const existingMap = new Map(existingConfigs.map((c) => [c.configKey, c]));

      for (const item of dto.items) {
        const existing = existingMap.get(item.configKey);
        if (existing) {
          await manager.update(Config, { id: existing.id }, {
            configValue: item.configValue,
            description: item.description ?? undefined,
          });
        } else {
          await manager.insert(Config, {
            appId: appId ?? undefined,
            groupKey,
            configKey: item.configKey,
            configValue: item.configValue,
            configType: item.configType ?? ConfigType.PUBLIC,
            description: item.description ?? undefined,
          });
        }
      }
    });
  }

  @CacheEvict({ keys: 'config:{appId}:{groupKey}' })
  async delete(appId: number | null, groupKey: string, id: number): Promise<void> {
    const where: FindOptionsWhere<Config> = { id, groupKey };
    if (appId !== null) {
      where.appId = appId;
    }
    const config = await this.repo.findOne({ where });
    if (!config) {
      return;
    }
    await this.repo.softDelete(id);
  }

  @CacheEvict({ keys: 'config:{appId}:{groupKey}' })
  async create(appId: number | null, groupKey: string, dto: CreateConfigDto): Promise<Config> {
    const entity = this.repo.create({ ...dto, appId: appId ?? undefined, groupKey });
    return this.repo.save(entity);
  }
}

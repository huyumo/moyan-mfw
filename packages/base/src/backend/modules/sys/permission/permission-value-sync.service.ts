import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PermissionValue } from './entities/permission-value.entity';
import { getPermissionValues, initPermissionValueCache } from '../../../common/constants/permissions';

@Injectable()
export class PermissionValueSyncService {
  private readonly logger = new Logger(PermissionValueSyncService.name);

  constructor(
    @InjectRepository(PermissionValue)
    private repo: Repository<PermissionValue>,
  ) {}

  async sync(dataSource: DataSource): Promise<void> {
    const declaredNames = new Set(getPermissionValues());
    const existing = await this.repo.find({ where: { status: 1 } });
    const existingNames = new Set(existing.map((e) => e.name));

    const deprecated = existing.filter((e) => !declaredNames.has(e.name));
    if (deprecated.length > 0) {
      await this.repo.update(
        deprecated.map((e) => ({ bitValue: e.bitValue })),
        { status: 0 },
      );
      this.logger.log(`标记废弃 ${deprecated.length} 个权限标签: ${deprecated.map((e) => e.name).join(', ')}`);
    }

    const added = [...declaredNames].filter((n) => !existingNames.has(n));
    if (added.length > 0) {
      const maxBit = await this.repo
        .createQueryBuilder('pv')
        .select('MAX(pv.bitPosition)', 'max')
        .getRawOne()
        .then((r) => (r?.max ?? -1));

      const newEntities = added.map((name, i) => {
        const bitPosition = Number(maxBit) + 1 + i;
        return this.repo.create({
          name,
          bitPosition,
          bitValue: 1n << BigInt(bitPosition),
          status: 1,
        });
      });

      await dataSource.transaction(async (manager) => {
        for (const entity of newEntities) {
          try {
            await manager.save(entity);
          } catch (err: any) {
            if (err?.code === 'ER_DUP_ENTRY') {
              this.logger.warn(`标签 "${entity.name}" (bitPosition=${entity.bitPosition}) 已存在，跳过`);
            } else {
              throw err;
            }
          }
        }
      });

      this.logger.log(`新增 ${newEntities.length} 个权限标签: ${added.join(', ')}`);
    }

    const allActive = await this.repo.find({ where: { status: 1 }, order: { bitPosition: 'ASC' } });
    initPermissionValueCache(allActive.map((e) => ({ name: e.name, bitValue: e.bitValue })));
    this.logger.log(`权限值缓存已初始化 (${allActive.length} 个标签)`);
  }
}

/**
 * @fileoverview 缓存模块
 * @description 动态模块，根据驱动选择 Redis 或 Memory 缓存实现
 */

import { Module, Global, DynamicModule } from '@nestjs/common';
import { RedisCacheService } from './services/redis-cache.service';
import { MemoryCacheService } from './services/memory-cache.service';
import { ICacheService, IRedisOnlyService } from './interfaces/cache-service.interface';

export type CacheDriver = 'auto' | 'redis' | 'memory';

export interface CacheModuleOptions {
  driver?: CacheDriver;
}

export const CACHE_SERVICE = Symbol('CACHE_SERVICE');
export const REDIS_ONLY_SERVICE = Symbol('REDIS_ONLY_SERVICE');

@Global()
@Module({})
export class CacheModule {
  static forRoot(options: CacheModuleOptions = {}): DynamicModule {
    const driver = options.driver || 'auto';

    const providers: any[] = [
      MemoryCacheService,
      RedisCacheService,
      {
        provide: CACHE_SERVICE,
        inject: [MemoryCacheService, RedisCacheService],
        useFactory: (
          memory: MemoryCacheService,
          redis: RedisCacheService,
        ): ICacheService => {
          if (driver === 'redis') return redis;
          if (driver === 'memory') return memory;
          return memory;
        },
      },
      {
        provide: REDIS_ONLY_SERVICE,
        inject: [RedisCacheService],
        useFactory: (redis: RedisCacheService): IRedisOnlyService => redis,
      },
    ];

    return {
      module: CacheModule,
      providers,
      exports: [CACHE_SERVICE, REDIS_ONLY_SERVICE],
    };
  }
}

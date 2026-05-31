/**
 * @fileoverview 缓存模块
 * @description 动态模块，根据驱动选择 Redis 或 Memory 缓存实现，默认 none（不开启）
 */

import { Module, Global, DynamicModule } from '@nestjs/common';
import { RedisCacheService } from './services/redis-cache.service';
import { MemoryCacheService } from './services/memory-cache.service';
import { ICacheService, IRedisOnlyService } from './interfaces/cache-service.interface';

export type CacheDriver = 'auto' | 'redis' | 'memory' | 'none';

export interface CacheModuleOptions {
  driver?: CacheDriver;
}

export const CACHE_SERVICE = Symbol('CACHE_SERVICE');
export const REDIS_ONLY_SERVICE = Symbol('REDIS_ONLY_SERVICE');

class NoopCacheService implements ICacheService {
  async get<T = unknown>(): Promise<T | null> {
    return null;
  }
  async set(): Promise<void> {}
  async del(): Promise<number> {
    return 0;
  }
  async delByPattern(): Promise<number> {
    return 0;
  }
  async exists(): Promise<boolean> {
    return false;
  }
  async getOrSet<T>(_key: string, factory: () => Promise<T | null>): Promise<T | null> {
    return factory();
  }
}

class NoopRedisOnlyService implements IRedisOnlyService {
  async tryLock(): Promise<string | null> {
    return null;
  }
  async unlock(): Promise<boolean> {
    return false;
  }
  async rateLimit(): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
    return { allowed: true, remaining: -1, resetIn: 0 };
  }
  async addToBlacklist(): Promise<void> {}
  async isBlacklisted(): Promise<boolean> {
    return false;
  }
}

@Global()
@Module({})
export class CacheModule {
  static forRoot(options: CacheModuleOptions = {}): DynamicModule {
    const driver = options.driver || 'none';

    if (driver === 'none') {
      return {
        module: CacheModule,
        providers: [
          {
            provide: CACHE_SERVICE,
            useClass: NoopCacheService,
          },
          {
            provide: REDIS_ONLY_SERVICE,
            useClass: NoopRedisOnlyService,
          },
        ],
        exports: [CACHE_SERVICE, REDIS_ONLY_SERVICE],
      };
    }

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

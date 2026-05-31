/**
 * @fileoverview 缓存模块
 * @description 动态模块，支持内置驱动（redis/memory/auto/none）或自定义实现
 */

import { Module, Global, DynamicModule, Type } from '@nestjs/common';
import { RedisCacheService } from './services/redis-cache.service';
import { MemoryCacheService } from './services/memory-cache.service';
import { ICacheService, IRedisOnlyService } from './interfaces/cache-service.interface';

export type CacheDriver = 'auto' | 'redis' | 'memory' | 'none';

export interface CacheModuleOptions {
  /** 内置驱动类型，默认 'none'。自定义实现时可选 */
  driver?: CacheDriver;
  /** 自定义缓存服务实现，需实现 ICacheService */
  useCacheService?: Type<ICacheService>;
  /** 自定义 Redis 专属服务实现（锁/限流/黑名单），需实现 IRedisOnlyService */
  useRedisOnlyService?: Type<IRedisOnlyService>;
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

    if (driver === 'none' && !options.useCacheService && !options.useRedisOnlyService) {
      return {
        module: CacheModule,
        providers: [
          { provide: CACHE_SERVICE, useClass: NoopCacheService },
          { provide: REDIS_ONLY_SERVICE, useClass: NoopRedisOnlyService },
        ],
        exports: [CACHE_SERVICE, REDIS_ONLY_SERVICE],
      };
    }

    return {
      module: CacheModule,
      providers: [
        ...buildBuiltinProviders(options),
        buildCacheServiceProvider(driver, options),
        buildRedisOnlyServiceProvider(driver, options),
      ],
      exports: [CACHE_SERVICE, REDIS_ONLY_SERVICE],
    };
  }
}

function buildBuiltinProviders(options: CacheModuleOptions) {
  const providers: any[] = [];
  if (!options.useCacheService) providers.push(MemoryCacheService);
  if (!options.useRedisOnlyService) providers.push(RedisCacheService);
  return providers;
}

function buildCacheServiceProvider(driver: string, options: CacheModuleOptions): any {
  if (options.useCacheService) {
    return { provide: CACHE_SERVICE, useClass: options.useCacheService };
  }

  return {
    provide: CACHE_SERVICE,
    inject: [MemoryCacheService, RedisCacheService],
    useFactory: (memory: MemoryCacheService, redis: RedisCacheService): ICacheService => {
      if (driver === 'redis') return redis;
      return memory;
    },
  };
}

function buildRedisOnlyServiceProvider(driver: string, options: CacheModuleOptions): any {
  if (options.useRedisOnlyService) {
    return { provide: REDIS_ONLY_SERVICE, useClass: options.useRedisOnlyService };
  }

  return {
    provide: REDIS_ONLY_SERVICE,
    inject: [MemoryCacheService, RedisCacheService],
    useFactory: (memory: MemoryCacheService, redis: RedisCacheService): IRedisOnlyService => {
      if (driver === 'memory') return memory;
      return redis;
    },
  };
}

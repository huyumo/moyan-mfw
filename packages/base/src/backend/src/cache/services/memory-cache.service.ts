/**
 * @fileoverview 内存缓存服务
 * @description 基于 Map 实现的轻量缓存，Redis 不可用时的降级方案
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ICacheService } from '../interfaces/cache-service.interface';
import { CacheTTL } from '../constants/cache.constants';

interface CacheEntry<T = unknown> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class MemoryCacheService implements ICacheService, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MemoryCacheService.name);
  private readonly store = new Map<string, CacheEntry>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  onModuleInit() {
    this.cleanupTimer = setInterval(() => this.cleanExpired(), 60_000);
    this.logger.log('内存缓存已就绪');
  }

  onModuleDestroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: unknown, ttlSeconds = CacheTTL.DEFAULT): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0,
    });
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async delByPattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let count = 0;
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  async exists(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T | null>,
    ttlSeconds = CacheTTL.DEFAULT,
  ): Promise<T | null> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const data = await factory();
    if (data !== null) await this.set(key, data, ttlSeconds);
    return data;
  }

  private cleanExpired(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.store) {
      if (entry.expiresAt > 0 && now > entry.expiresAt) {
        this.store.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) this.logger.debug(`清理过期缓存: ${cleaned} 条`);
  }
}

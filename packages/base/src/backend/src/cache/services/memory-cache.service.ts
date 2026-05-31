/**
 * @fileoverview 内存缓存服务
 * @description 基于 Map 实现的轻量缓存，Redis 不可用时的降级方案
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ICacheService, IRedisOnlyService } from '../interfaces/cache-service.interface';
import { CacheTTL } from '../constants/cache.constants';

interface CacheEntry<T = unknown> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class MemoryCacheService implements ICacheService, IRedisOnlyService, OnModuleInit, OnModuleDestroy {
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

  async set(key: string, value: unknown, ttlSeconds: number = CacheTTL.DEFAULT): Promise<void> {
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
    ttlSeconds: number = CacheTTL.DEFAULT,
  ): Promise<T | null> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const data = await factory();
    if (data !== null) await this.set(key, data, ttlSeconds);
    return data;
  }

  // === IRedisOnlyService 实现 ===

  async tryLock(resource: string, ttlSeconds = 30): Promise<string | null> {
    const key = `lock:${resource}`;
    const existing = await this.get(key);
    if (existing !== null) return null;
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await this.set(key, token, ttlSeconds);
    return token;
  }

  async unlock(resource: string, token: string): Promise<boolean> {
    const key = `lock:${resource}`;
    const existing = await this.get(key);
    if (existing !== token) return false;
    await this.del(key);
    return true;
  }

  async rateLimit(key: string, max: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
    const fullKey = `rate:${key}`;
    const entry = this.store.get(fullKey);
    const now = Date.now();

    if (!entry || (entry.expiresAt > 0 && now > entry.expiresAt)) {
      const count = 1;
      this.store.set(fullKey, {
        value: { count, windowStart: now },
        expiresAt: now + windowSeconds * 1000,
      });
      return { allowed: true, remaining: max - count, resetIn: windowSeconds };
    }

    const data = entry.value as { count: number; windowStart: number };
    data.count += 1;
    return {
      allowed: data.count <= max,
      remaining: Math.max(0, max - data.count),
      resetIn: Math.max(0, Math.ceil((data.windowStart + windowSeconds * 1000 - now) / 1000)),
    };
  }

  async addToBlacklist(jti: string, expiresIn: number): Promise<void> {
    await this.set(`token:blacklist:${jti}`, '1', expiresIn);
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    return (await this.get(`token:blacklist:${jti}`)) !== null;
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

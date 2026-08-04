/**
 * @fileoverview 缓存服务接口
 * @description 定义缓存通用接口与 Redis 专属接口
 */

import type { RedisClientType } from 'redis';

export interface ICacheService {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(...keys: string[]): Promise<number>;
  delByPattern(pattern: string): Promise<number>;
  exists(key: string): Promise<boolean>;
  getOrSet<T>(key: string, factory: () => Promise<T | null>, ttlSeconds?: number): Promise<T | null>;
}

export interface IRedisOnlyService {
  tryLock(resource: string, ttlSeconds?: number): Promise<string | null>;
  unlock(resource: string, token: string): Promise<boolean>;
  rateLimit(key: string, max: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetIn: number }>;
  addToBlacklist(jti: string, expiresIn: number): Promise<void>;
  isBlacklisted(jti: string): Promise<boolean>;
  /** 获取原始 Redis 客户端（用于 SCAN/KEYS/PUBLISH/SUBSCRIBE 等），非 Redis 模式下返回 null */
  getClient(): RedisClientType | null;
}

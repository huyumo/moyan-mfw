/**
 * @fileoverview Redis 缓存服务
 * @description 基于 node-redis v4 的缓存实现，提供缓存、锁、限流、黑名单能力
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ICacheService, IRedisOnlyService } from '../interfaces/cache-service.interface';
import { CacheTTL } from '../constants/cache.constants';

@Injectable()
export class RedisCacheService
  implements ICacheService, IRedisOnlyService, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RedisCacheService.name);
  private client: RedisClientType;
  private connected = false;

  constructor() {}

  async onModuleInit() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD || '';
    const db = parseInt(process.env.REDIS_DB || '0', 10);

    this.client = createClient({
      socket: {
        host,
        port,
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 10) return new Error('重连次数超限');
          return Math.min(retries * 500, 5000);
        },
      },
      password: password || undefined,
      database: db,
    });

    this.client.on('ready', () => {
      this.connected = true;
      this.logger.log(`Redis 已连接 ${host}:${port}`);
    });
    this.client.on('end', () => {
      this.connected = false;
    });
    this.client.on('error', (err) => this.logger.error('Redis 连接错误', err));

    setImmediate(() => {
      this.client.connect().catch(() => {
        this.logger.warn(`Redis 不可用 (${host}:${port})，缓存降级为内存模式`);
      });
    });
  }

  async onModuleDestroy() {
    if (this.connected) await this.client?.quit();
  }

  private requireClient(): RedisClientType {
    if (!this.connected) {
      throw new Error('Redis 未连接，当前为内存缓存模式，此操作不可用');
    }
    return this.client;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.requireClient().get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as T;
    }
  }

  async set(key: string, value: unknown, ttl = CacheTTL.DEFAULT): Promise<void> {
    const raw = typeof value === 'string' ? value : JSON.stringify(value);
    await this.requireClient().setEx(key, ttl, raw);
  }

  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return await this.requireClient().del(keys);
  }

  async delByPattern(pattern: string): Promise<number> {
    let deleted = 0;
    for await (const key of this.requireClient().scanIterator({ MATCH: pattern, COUNT: 100 })) {
      await this.client.del(key);
      deleted++;
    }
    if (deleted > 0) this.logger.log(`批量删除缓存: pattern="${pattern}", deleted=${deleted}`);
    return deleted;
  }

  async exists(key: string): Promise<boolean> {
    return (await this.requireClient().exists(key)) === 1;
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T | null>,
    ttl = CacheTTL.DEFAULT,
  ): Promise<T | null> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const data = await factory();
    if (data !== null) await this.set(key, data, ttl);
    return data;
  }

  async tryLock(resource: string, ttlSeconds = 30): Promise<string | null> {
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = await this.requireClient().set(`lock:${resource}`, token, {
      NX: true,
      EX: ttlSeconds,
    });
    return result === 'OK' ? token : null;
  }

  async unlock(resource: string, token: string): Promise<boolean> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await this.requireClient().eval(script, {
      keys: [`lock:${resource}`],
      arguments: [token],
    });
    return result === 1;
  }

  async rateLimit(key: string, max: number, windowSeconds: number) {
    const c = this.requireClient();
    const fullKey = `rate:${key}`;
    const [count] = (await c.multi().incr(fullKey).expire(fullKey, windowSeconds, 'NX').exec()) as [number];

    const ttl = await c.ttl(fullKey);
    return {
      allowed: count <= max,
      remaining: Math.max(0, max - count),
      resetIn: ttl > 0 ? ttl : 0,
    };
  }

  async addToBlacklist(jti: string, expiresIn: number): Promise<void> {
    await this.requireClient().setEx(`token:blacklist:${jti}`, expiresIn, '1');
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    return (await this.requireClient().exists(`token:blacklist:${jti}`)) === 1;
  }

  getClient(): RedisClientType {
    return this.requireClient();
  }
}

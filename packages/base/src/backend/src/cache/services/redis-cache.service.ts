/**
 * @fileoverview Redis 缓存服务
 * @description 基于 node-redis v4 的缓存实现，提供缓存、锁、限流、黑名单能力
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { ICacheService, IRedisOnlyService } from '../interfaces/cache-service.interface';
import { CacheTTL } from '../constants/cache.constants';

@Injectable()
export class RedisCacheService
  implements ICacheService, IRedisOnlyService, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RedisCacheService.name);
  private client: RedisClientType;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('host');
    const port = this.configService.get<number>('port');
    const password = this.configService.get<string>('password');
    const db = this.configService.get<number>('db');

    this.client = createClient({
      socket: { host, port },
      password: password || undefined,
      database: db,
    });

    this.client.on('error', (err) => this.logger.error('Redis 连接错误', err));
    this.client.on('connect', () => this.logger.log(`Redis 已连接 ${host}:${port}`));

    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as T;
    }
  }

  async set(key: string, value: unknown, ttl = CacheTTL.DEFAULT): Promise<void> {
    const raw = typeof value === 'string' ? value : JSON.stringify(value);
    await this.client.setEx(key, ttl, raw);
  }

  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return await this.client.del(keys);
  }

  async delByPattern(pattern: string): Promise<number> {
    let deleted = 0;
    for await (const key of this.client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      await this.client.del(key);
      deleted++;
    }
    if (deleted > 0) this.logger.log(`批量删除缓存: pattern="${pattern}", deleted=${deleted}`);
    return deleted;
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
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
    const result = await this.client.set(`lock:${resource}`, token, {
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
    const result = await this.client.eval(script, {
      keys: [`lock:${resource}`],
      arguments: [token],
    });
    return result === 1;
  }

  async rateLimit(key: string, max: number, windowSeconds: number) {
    const count = await this.client.incr(`rate:${key}`);
    if (count === 1) await this.client.expire(`rate:${key}`, windowSeconds);

    const ttl = await this.client.ttl(`rate:${key}`);
    return {
      allowed: count <= max,
      remaining: Math.max(0, max - count),
      resetIn: ttl > 0 ? ttl : 0,
    };
  }

  async addToBlacklist(jti: string, expiresIn: number): Promise<void> {
    await this.client.setEx(`token:blacklist:${jti}`, expiresIn, '1');
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    return (await this.client.exists(`token:blacklist:${jti}`)) === 1;
  }

  getClient(): RedisClientType {
    return this.client;
  }
}

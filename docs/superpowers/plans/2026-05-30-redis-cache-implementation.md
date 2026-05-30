# Redis 缓存体系实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `packages/base/src/backend/src/cache/` 下构建完整的缓存体系（Redis + Memory 双层），包含注解驱动的声明式缓存、分布式锁、速率限制、Token 黑名单。

**Architecture:** 定义 `ICacheService` 统一接口，由 `RedisCacheService`（基于 node-redis v4）和 `MemoryCacheService`（基于 Map）双实现。通过 `CacheModule.forRoot({ driver })` 动态选择驱动。`@Cacheable` / `@CacheEvict` 装饰器 + `CacheInterceptor` 拦截器实现声明式缓存。AuthGuard 注入 `IRedisOnlyService`（@Optional）检查黑名单。

**Tech Stack:** TypeScript, NestJS, node-redis v4 (`redis`), `@nestjs/config`, `@nestjs/jwt`, RxJS

**Spec Reference:** `docs/superpowers/specs/2026-05-30-redis-cache-design.md`

---

### Task 1: Cache 模块目录与常量文件

**Files:**
- Create: `packages/base/src/backend/src/cache/constants/cache.constants.ts`
- Create: `packages/base/src/backend/src/cache/interfaces/cache-service.interface.ts`

- [ ] **Step 1: 创建 `cache.constants.ts`**

```typescript
/**
 * @fileoverview 缓存常量
 * @description TTL 分级常量与速率限制预设
 */

/** TTL 分级常量（秒） */
export const CacheTTL = {
  /** 短缓存：验证码、空值防穿透 (3 分钟) */
  SHORT: 180,
  /** 默认缓存 (30 分钟) */
  DEFAULT: 1800,
  /** 中缓存：字典数据、系统配置 (1 小时) */
  MEDIUM: 3600,
  /** 长缓存：权限值、菜单树等低频变更数据 (2 小时) */
  LONG: 7200,
} as const;

/** 速率限制预设 */
export const RateLimit = {
  /** 登录：单 IP 60 秒最多 5 次 */
  LOGIN: { max: 5, window: 60 },
  /** 验证码：单手机号 60 秒 1 次 */
  CAPTCHA: { max: 1, window: 60 },
  /** API 全局限流：单 IP 每秒 20 次 */
  GLOBAL: { max: 20, window: 1 },
  /** 敏感操作：单用户 10 分钟 3 次 */
  SENSITIVE: { max: 3, window: 600 },
} as const;
```

- [ ] **Step 2: 创建 `cache-service.interface.ts`**

```typescript
/**
 * @fileoverview 缓存服务接口
 * @description 定义缓存通用接口与 Redis 专属接口
 */

/** 通用缓存接口 — Redis 与 Memory 双实现 */
export interface ICacheService {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(...keys: string[]): Promise<number>;
  delByPattern(pattern: string): Promise<number>;
  exists(key: string): Promise<boolean>;
  getOrSet<T>(key: string, factory: () => Promise<T | null>, ttlSeconds?: number): Promise<T | null>;
}

/** Redis 专属能力 — 仅 Redis 实现提供，内存模式不可用 */
export interface IRedisOnlyService {
  tryLock(resource: string, ttlSeconds?: number): Promise<string | null>;
  unlock(resource: string, token: string): Promise<boolean>;
  rateLimit(key: string, max: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetIn: number }>;
  addToBlacklist(jti: string, expiresIn: number): Promise<void>;
  isBlacklisted(jti: string): Promise<boolean>;
}
```

- [ ] **Step 3: 类型检查**

Run: `pnpm typecheck:base-backend`
Expected: PASS (文件仅有类型定义，无依赖冲突)

- [ ] **Step 4: Commit**

```bash
git add packages/base/src/backend/src/cache/
git commit -m "feat(cache): add cache constants and interfaces"
```

---

### Task 2: MemoryCacheService 实现

**Files:**
- Create: `packages/base/src/backend/src/cache/services/memory-cache.service.ts`

- [ ] **Step 1: 实现 `MemoryCacheService`**

参考 `MemoryCacheService` 接口实现，关键点：
- 使用 `Map<string, { value: unknown; expiresAt: number }>` 内部存储
- `get()` 时检查 `expiresAt`，过期自动删除并返回 null
- `delByPattern()` 将 `*` 转 RegExp 遍历删除
- `onModuleInit` 中启动 `setInterval`（60s）定时清理过期条目
- `onModuleDestroy` 中清除定时器

```typescript
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
```

- [ ] **Step 2: 类型检查**

Run: `pnpm typecheck:base-backend`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/base/src/backend/src/cache/services/memory-cache.service.ts
git commit -m "feat(cache): implement MemoryCacheService with Map backend"
```

---

### Task 3: RedisCacheService 实现

**Files:**
- Create: `packages/base/src/backend/src/cache/services/redis-cache.service.ts`

- [ ] **Step 1: 实现 `RedisCacheService`**

该类同时实现 `ICacheService` 和 `IRedisOnlyService`。关键点：
- 通过 `ConfigService` 读取 Redis 配置（host/port/password/db），注意 config key 无命名空间前缀 —— 配置通过 `redis.config.ts` 的 `registerAs` 直接注册，key 是 `host`、`port` 等裸 key
- `onModuleInit` 中用 `createClient` 创建并连接
- `get/set` 使用 `JSON.parse/stringify` 序列化
- `delByPattern` 使用 `scanIterator`（非 `KEYS`）
- 分布式锁：`SET key token NX EX ttl` + Lua 脚本释放
- 速率限制：`INCR` + 首调用设 `EXPIRE`

```typescript
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

  // ==================== ICacheService ====================

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw === null) return null;
    try { return JSON.parse(raw) as T; } catch { return raw as T; }
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

  // ==================== IRedisOnlyService ====================

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
```

- [ ] **Step 2: 类型检查**

Run: `pnpm typecheck:base-backend`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/base/src/backend/src/cache/services/redis-cache.service.ts
git commit -m "feat(cache): implement RedisCacheService with lock, rate limit, blacklist"
```

---

### Task 4: CacheModule 动态模块

**Files:**
- Create: `packages/base/src/backend/src/cache/cache.module.ts`

- [ ] **Step 1: 实现 `CacheModule`**

```typescript
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
```

- [ ] **Step 2: 类型检查**

Run: `pnpm typecheck:base-backend`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/base/src/backend/src/cache/cache.module.ts
git commit -m "feat(cache): add CacheModule dynamic module with driver selection"
```

---

### Task 5: 缓存装饰器

**Files:**
- Create: `packages/base/src/backend/src/cache/decorators/cache.decorator.ts`

- [ ] **Step 1: 实现 `@Cacheable`、`@CacheEvict`、`@CacheMethodKey`**

```typescript
/**
 * @fileoverview 缓存装饰器
 * @description 声明式缓存注解：@Cacheable 读缓存、@CacheEvict 删缓存、@CacheMethodKey 标记参数
 */

import { SetMetadata } from '@nestjs/common';

export const CACHE_OPTIONS = Symbol('cache:options');
export const CACHE_EVICT_OPTIONS = Symbol('cache:evict');
export const CACHE_METHOD_KEY = Symbol('cache:method_key');

export interface CacheableOptions {
  key: string;
  ttl?: number;
  unlessNull?: boolean;
}

export interface CacheEvictOptions {
  keys: string | string[];
}

export function Cacheable(options: CacheableOptions) {
  return SetMetadata(CACHE_OPTIONS, options);
}

export function CacheEvict(options: CacheEvictOptions) {
  return SetMetadata(CACHE_EVICT_OPTIONS, options);
}

export function CacheMethodKey(name: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    const existing: Map<number, string> =
      Reflect.getMetadata(CACHE_METHOD_KEY, target, propertyKey) || new Map();
    existing.set(parameterIndex, name);
    Reflect.defineMetadata(CACHE_METHOD_KEY, existing, target, propertyKey);
  };
}
```

- [ ] **Step 2: 类型检查**

Run: `pnpm typecheck:base-backend`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/base/src/backend/src/cache/decorators/cache.decorator.ts
git commit -m "feat(cache): add @Cacheable, @CacheEvict, @CacheMethodKey decorators"
```

---

### Task 6: CacheInterceptor 拦截器

**Files:**
- Create: `packages/base/src/backend/src/cache/interceptors/cache.interceptor.ts`

- [ ] **Step 1: 实现 `CacheInterceptor`**

拦截器通过 `Reflector` 读取方法上的 `@Cacheable` / `@CacheEvict` metadata，调用 `ICacheService`（由 `@Inject(CACHE_SERVICE)` 注入，不直接依赖 Redis）。

key 模板解析：`{#paramName}` → 从路由 params / body / query 中提取实际值。

对于 `@CacheEvict`：方法执行完成后（`tap`）删除缓存。若 key 含 `*` 走 `delByPattern`。

对于 `@Cacheable`：先查缓存 → 命中直接返回 → 未命中执行方法 → 缓存结果。
使用 `from()` 将 Promise 转为 Observable。

```typescript
/**
 * @fileoverview 缓存拦截器
 * @description 拦截 @Cacheable / @CacheEvict 注解的方法，自动处理缓存读写
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import {
  CACHE_OPTIONS,
  CACHE_EVICT_OPTIONS,
  CACHE_METHOD_KEY,
  CacheableOptions,
  CacheEvictOptions,
} from '../decorators/cache.decorator';
import { CACHE_SERVICE } from '../cache.module';
import { ICacheService } from '../interfaces/cache-service.interface';
import { CacheTTL } from '../constants/cache.constants';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(CACHE_SERVICE) private readonly cache: ICacheService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const handler = context.getHandler();
    const cacheConfig = this.reflector.get<CacheableOptions>(CACHE_OPTIONS, handler);
    const evictConfig = this.reflector.get<CacheEvictOptions>(CACHE_EVICT_OPTIONS, handler);

    if (evictConfig) {
      return next.handle().pipe(
        tap(async () => {
          const keys = this.resolveKeys(evictConfig.keys, context, handler);
          for (const key of keys) {
            if (key.includes('*')) {
              await this.cache.delByPattern(key);
            } else {
              await this.cache.del(key);
            }
          }
        }),
      );
    }

    if (cacheConfig) {
      const key = this.resolveKey(cacheConfig.key, context, handler);
      const ttl = cacheConfig.ttl ?? CacheTTL.DEFAULT;

      return from(this.cache.get(key)).pipe(
        switchMap((cached) => {
          if (cached !== null) return of(cached);

          return next.handle().pipe(
            switchMap((result) => {
              if (result !== undefined && result !== null) {
                return from(this.cache.set(key, result, ttl)).pipe(
                  switchMap(() => of(result)),
                );
              }
              return of(result);
            }),
          );
        }),
      );
    }

    return next.handle();
  }

  private resolveKey(template: string, context: ExecutionContext, handler: any): string {
    const paramMap: Map<number, string> =
      Reflect.getMetadata(CACHE_METHOD_KEY, context.getClass(), handler.name) || new Map();

    return template.replace(/\{#(\w+)\}/g, (_, name: string) => {
      for (const [idx, n] of paramMap) {
        if (n === name) {
          const args = context.getArgs();
          return String(args[idx] ?? '');
        }
      }
      const req = context.switchToHttp().getRequest();
      return String(req.body?.[name] ?? req.params?.[name] ?? req.query?.[name] ?? '');
    });
  }

  private resolveKeys(
    keys: string | string[],
    context: ExecutionContext,
    handler: any,
  ): string[] {
    const list = Array.isArray(keys) ? keys : [keys];
    return list.map((k) => this.resolveKey(k, context, handler));
  }
}
```

- [ ] **Step 2: 类型检查**

Run: `pnpm typecheck:base-backend`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/base/src/backend/src/cache/interceptors/cache.interceptor.ts
git commit -m "feat(cache): add CacheInterceptor for declarative cache handling"
```

---

### Task 7: 注册 CacheModule 到 AppModule

**Files:**
- Modify: `packages/base/src/backend/src/app.module.ts`

- [ ] **Step 1: 在 AppModule imports 中注册 `CacheModule.forRoot()`**

在 `app.module.ts` 顶部添加 import：
```typescript
import { CacheModule } from './cache/cache.module';
```

在 `@Module` 的 `imports` 数组最前面添加：
```typescript
CacheModule.forRoot(),
```

- [ ] **Step 2: 同时在 `createBaseBackendApp` 中注册**

修改 `packages/base/src/backend/src/create-base-backend-app.ts`，同样在 imports 中添加：
```typescript
CacheModule.forRoot(),
```

- [ ] **Step 3: 注册 `CacheInterceptor` 为全局拦截器**

在 `app.module.ts` 的 `providers` 中已有 `APP_INTERCEPTOR` 模式，参考：
```typescript
import { CacheInterceptor } from './cache/interceptors/cache.interceptor';

// 在 providers 中添加
{
  provide: APP_INTERCEPTOR,
  useClass: CacheInterceptor,
},
```

> **注意**: 拦截器应放在其他拦截器之前（或之后根据需求），确保 `@Cacheable` 最早/最晚生效。建议放在 `LoggingInterceptor` 之前以降低日志噪音。

- [ ] **Step 4: 类型检查**

Run: `pnpm typecheck:base-backend`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/base/src/backend/src/app.module.ts packages/base/src/backend/src/create-base-backend-app.ts
git commit -m "feat(cache): register CacheModule and CacheInterceptor globally"
```

---

### Task 8: Token 黑名单 — AuthGuard 检查

**Files:**
- Modify: `packages/base/src/backend/src/common/guards/auth.guard.ts`

- [ ] **Step 1: 在 AuthGuard 中注入 `@Optional()` IRedisOnlyService 并检查黑名单**

在 JWT 验证通过后、放行前，检查 Token 是否在黑名单。需要：
1. 在 JWT 验证后提取 `jti`（需确保 auth.service.ts 签发时包含 jti —— 见 Task 9）
2. 调用 `isBlacklisted(jti)` 检查

```typescript
import { Optional, Inject } from '@nestjs/common';
import { REDIS_ONLY_SERVICE } from '../../cache/cache.module';
import { IRedisOnlyService } from '../../cache/interfaces/cache-service.interface';

// 在 constructor 中添加
constructor(
  private jwtService: JwtService,
  private reflector: Reflector,
  @Optional() @Inject(REDIS_ONLY_SERVICE) private readonly redis?: IRedisOnlyService,
) {}

// 在 canActivate 中，JWT 验证成功后、return true 前添加：
if (this.redis && payload.jti) {
  const blacklisted = await this.redis.isBlacklisted(payload.jti);
  if (blacklisted) {
    throw new UnauthorizedException('Token 已失效，请重新登录');
  }
}
```

同时在 `JwtPayload` 接口中添加 `jti` 字段：
```typescript
export interface JwtPayload {
  sub: string;
  username: string;
  roleIds?: string[];
  jti?: string;
}
```

- [ ] **Step 2: 类型检查**

Run: `pnpm typecheck:base-backend`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/base/src/backend/src/common/guards/auth.guard.ts
git commit -m "feat(cache): add token blacklist check in AuthGuard"
```

---

### Task 9: Token 黑名单 — AuthService 签发 jti 与 logout 写入

**Files:**
- Modify: `packages/base/src/backend/src/modules/sys/auth/auth.service.ts`

- [ ] **Step 1: 在 login 时加入 jti**

在 `login()` 方法的 payload 中添加 `jti`：
```typescript
import { randomUUID } from 'crypto';

// 在 signAsync 前
const jwtConfig = this.getJwtConfig();
const payload = {
  sub: user.id,
  username: user.username,
  roleIds: userRoles.map((ur) => ur.roleId),
  jti: randomUUID(),
};

const accessToken = await this.jwtService.signAsync(payload);
const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: jwtConfig.refreshExpiresIn });
```

- [ ] **Step 2: 实现 logout 黑名单写入**

通过 `@Optional()` 注入 `IRedisOnlyService`，在 `logout` 中：
1. 解析 Token 获取 `jti` 和 `exp`
2. 调用 `addToBlacklist(jti, remainingSeconds)`

```typescript
import { Optional, Inject } from '@nestjs/common';
import { REDIS_ONLY_SERVICE } from '../../cache/cache.module';
import { IRedisOnlyService } from '../../cache/interfaces/cache-service.interface';

// constructor 添加：
constructor(
  // ...existing deps...
  @Optional() @Inject(REDIS_ONLY_SERVICE) private readonly redis?: IRedisOnlyService,
) {}

// logout 实现：
async logout(token: string): Promise<void> {
  if (!this.redis) return;

  try {
    const decoded = await this.jwtService.verifyAsync(token, { ignoreExpiration: true });
    if (decoded?.jti) {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, (decoded.exp || 0) - now);
      if (remaining > 0) {
        await this.redis.addToBlacklist(decoded.jti, remaining);
      }
    }
  } catch {
    // Token 无效时静默处理，因为注销操作本身不应对无效 Token 报错
  }
}
```

- [ ] **Step 3: 类型检查**

Run: `pnpm typecheck:base-backend`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/base/src/backend/src/modules/sys/auth/auth.service.ts
git commit -m "feat(cache): implement token blacklist in logout with jti support"
```

---

### Task 10: 最终验证

- [ ] **Step 1: 完整类型检查**

Run: `pnpm typecheck`
Expected: PASS（全项目零错误）

- [ ] **Step 2: 后端构建验证**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: 检查是否有遗漏的 lint 问题**

Run: `pnpm format:check`
Expected: PASS

- [ ] **Step 4: Commit（如有格式修复）**

```bash
git add -u
git commit -m "chore: final verification — typecheck and format"
```

---

### 完成标准

- [x] `packages/base/src/backend/src/cache/` 目录结构完整（7 个文件）
- [x] `CacheModule.forRoot()` 在 `app.module.ts` 和 `create-base-backend-app.ts` 中注册
- [x] `CacheInterceptor` 全局注册，拦截 `@Cacheable` / `@CacheEvict`
- [x] `AuthGuard` 在内存模式下照常工作，Redis 可用时启用黑名单检查
- [x] `AuthService.logout()` 从空实现变为可工作的黑名单写入
- [x] `pnpm typecheck` 零错误
- [ ] 后续：业务模块逐步添加 `@Cacheable` / `@CacheEvict` 注解（不在本次计划）

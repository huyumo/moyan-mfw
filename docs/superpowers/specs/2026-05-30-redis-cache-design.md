# Redis 缓存体系设计

> **日期**: 2026-05-30
> **状态**: 设计已确认，待实现
> **驱动**: `brainstorming` → `writing-plans`

---

## 1. 背景与目标

### 1.1 现状

- Redis 基础设施已完全就绪（Docker Redis 7、配置工厂、环境变量、`redis` v4 依赖）
- 业务代码中 **零 Redis 使用**，无客户端初始化、无 RedisService、无缓存拦截器
- `auth.service.ts:logout()` 存在 Token 黑名单 TODO，未实现
- 唯一内存缓存：`Map<string, bigint>` 存权限值

### 1.2 目标

| 场景 | 说明 |
|------|------|
| Token 管理 | JWT 黑名单（注销）、刷新令牌存储 |
| 数据查询缓存 | 高频查询缓存（实体 + 字典），减轻 DB 压力 |
| 分布式锁 | 防止重复提交、幂等性保证 |
| 速率限制 | 登录限流、验证码限流、API 全局限流 |

---

## 2. 核心设计：双重缓存失效机制

### 2.1 原理

```
第一重【主动失效】：写操作后立即删除相关缓存 (覆盖 90% 场景)
第二重【TTL 兜底】  ：缓存写入时设自动过期 (覆盖剩余 10%)
```

### 2.2 读取流程

```
请求 → 查缓存 → HIT → 返回
              → MISS → 查 DB → 写缓存(+TTL) → 返回
```

### 2.3 写入流程

```
写操作(C/U/D) → 执行 DB 写 → 删除相关缓存 key
             → 下一个读请求 → Cache Miss → 从 DB 加载 → 写入缓存
```

---

## 3. TTL 分级策略

| 等级 | 时长 | 适用数据 | 示例 key |
|------|------|----------|----------|
| `SHORT` | 180s (3min) | 验证码、空值防穿透、热列表 | `auth:captcha:{uuid}` |
| `DEFAULT` | 1800s (30min) | 通用实体缓存 | `sys:user:{id}` |
| `MEDIUM` | 3600s (1h) | 字典表、系统配置 | `sys:dict:status_list` |
| `LONG` | 7200s (2h) | 权限值、菜单树 | `sys:permission:values` |

---

## 4. 缓存双层抽象

### 4.1 架构

```
业务层 ─→ ICacheService (统一接口)
              ├── RedisCacheService  (node-redis v4 + 锁/限流/黑名单)
              └── MemoryCacheService (Map + setTimeout 定时清理)
```

### 4.2 驱动选择

```
CacheModule.forRoot({ driver: 'auto' })    ← 默认走内存
CacheModule.forRoot({ driver: 'redis' })   ← 显式启用 Redis
CacheModule.forRoot({ driver: 'memory' })  ← 强制内存
```

### 4.3 接口分离

- `ICacheService` → 通用缓存 (get/set/del/delByPattern/getOrSet)，两种实现都提供
- `IRedisOnlyService` → Redis 专属 (tryLock/unlock/rateLimit/addToBlacklist/isBlacklisted)，仅 Redis 实现提供
- 业务层对 `IRedisOnlyService` 使用 `@Optional()` 注入 + `?.` 可选链降级

---

## 5. 缓存注解体系

### 5.1 装饰器

| 装饰器 | 作用 |
|--------|------|
| `@Cacheable({ key, ttl?, unlessNull? })` | 读缓存 → 未命中调方法 → 缓存结果 |
| `@CacheEvict({ keys })` | 方法执行后删除缓存 |
| `@CacheMethodKey('name')` | 标记参数名，用于 key 模板 `{#name}` |

### 5.2 实现方式

由 `CacheInterceptor` 拦截器通过 `Reflector` 读取 metadata → 调用 `ICacheService`，而非直接依赖 Redis。

---

## 6. 列表缓存策略（方案 B）

**核心决策：不缓存业务列表，只缓存实体和字典**

| 层级 | 策略 | 说明 |
|------|------|------|
| 字典/枚举列表 | `@Cacheable` 缓存，TTL: MEDIUM | 数据量小、变更极低频 |
| 业务列表查询 | 不缓存 | 参数组合爆炸、失效粒度粗、DB 索引已足够 |
| 高频热点列表 | 哈希 key + SHORT TTL，按需添加 | 通过监控识别后定向优化 |

---

## 7. Token 黑名单

```
注销 → 提取 jti + 剩余有效期 (exp - now)
     → SETEX token:blacklist:{jti} {剩余秒数} "1"
     
AuthGuard → JWT 验证通过 → EXISTS token:blacklist:{jti}
          → 存在 → 403
          → 不存在 → 放行
```

---

## 8. 分布式锁

```
获取: SET lock:{resource} {token} NX EX {ttl}  → 成功返回 token，失败返回 null
释放: Lua 脚本比对 token 后 DEL（原子性保证）
```

---

## 9. 速率限制

```
INCR rate:{key} → count=1 时 EXPIRE {windowSeconds}
                → 返回 { allowed, remaining, resetIn }
超出 max 时抛 HttpException(429)
```

预设档位：登录 5/60s、验证码 1/60s、全局 20/1s、敏感操作 3/600s

---

## 10. Key 命名规范

```
mfw:sys:user:{id}              ← 用户实体
mfw:sys:dict:{code}            ← 字典数据
mfw:sys:permission:values      ← 权限值
mfw:token:blacklist:{jti}      ← Token 黑名单
mfw:rate:{ip}:{action}         ← 限流计数
mfw:lock:{resource}            ← 分布式锁
```

前缀 `mfw:` 由 `redis.config.ts` 的 `keyPrefix` 配置统一注入。

---

## 11. 文件结构

```
packages/base/src/backend/src/cache/
├── interfaces/
│   └── cache-service.interface.ts    ← ICacheService + IRedisOnlyService
├── constants/
│   └── cache.constants.ts            ← CacheTTL + RateLimit 预设
├── services/
│   ├── redis-cache.service.ts        ← Redis 实现
│   └── memory-cache.service.ts       ← 内存实现
├── decorators/
│   └── cache.decorator.ts            ← @Cacheable / @CacheEvict / @CacheMethodKey
├── interceptors/
│   └── cache.interceptor.ts          ← 拦截器（反射 + ICacheService）
└── cache.module.ts                   ← 动态模块（驱动选择）
```

---

## 12. 不纳入的设计

- 不使用 `@nestjs/cache-manager`（增加依赖但灵活性不如手写）
- 不使用 `ioredis`（项目依赖已是 `redis` v4）
- 列表缓存不同步实现（方案 B，按需后续添加）
- 缓存预热策略（YAGNI，当前无预热需求）

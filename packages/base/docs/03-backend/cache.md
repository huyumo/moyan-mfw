# 后端 · 缓存

框架内置缓存模块（`CacheModule`），支持 `none` / `memory` / `redis` 三种驱动，通过环境变量 `CACHE_DRIVER` 或工厂选项选择。

## 驱动选择

```bash
CACHE_DRIVER=none      # 关闭缓存（默认）
CACHE_DRIVER=memory    # 进程内内存缓存
CACHE_DRIVER=redis     # Redis 缓存（推荐生产使用）
```

Redis 连接复用 `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` 环境变量，也可通过 `createBaseBackendApp({ redis })` 传入。

## 装饰器

### `@Cacheable({ ttl, key? })` — 方法结果缓存

```typescript
import { Cacheable } from 'moyan-mfw-base/backend';

@Injectable()
export class UserService {
  /** 缓存 60 秒；key 缺省时由类名:方法名:参数序列化自动生成 */
  @Cacheable({ ttl: 60 })
  async findById(id: string) {
    return this.repository.findOne({ where: { id } });
  }
}
```

### `@CacheEvict({ keys })` — 缓存失效

```typescript
import { CacheEvict } from 'moyan-mfw-base/backend';

@CacheEvict({ keys: ['UserService:findById:*'] })
async update(id: string, dto: UpdateDto) {
  // 更新后自动清除匹配的缓存
}
```

## 服务注入

```typescript
import { CACHE_SERVICE, ICacheService } from 'moyan-mfw-base/backend';

@Injectable()
export class MyService {
  constructor(@Inject(CACHE_SERVICE) private readonly cache: ICacheService) {}

  async demo() {
    await this.cache.set('key', JSON.stringify({ a: 1 }), 60);
    const raw = await this.cache.get('key');
  }
}
```

`ICacheService`：`get(key)` / `set(key, value, ttl?)` / `del(key)` / `delByPattern(pattern)` 等。

## 常量

```typescript
import { CacheTTL, RateLimit } from 'moyan-mfw-base/backend';

CacheTTL.SHORT;   // 短缓存（30s 级）
CacheTTL.MEDIUM;  // 中等缓存
CacheTTL.LONG;    // 长缓存
RateLimit;        // 限流相关常量
```

## 使用规范

1. 缓存 key 必须包含业务维度（如 `userId` / `appId`），避免串数据。
2. 写操作（update/delete）记得 `@CacheEvict`，或让 key 带时间戳/版本号。
3. `none` 驱动下装饰器直接放行，不会影响业务逻辑（可安全用于本地开发）。
4. 敏感数据（密码哈希等）不要缓存。

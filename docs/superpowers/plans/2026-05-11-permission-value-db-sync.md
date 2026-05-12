# 权限值 DB 同步 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将权限标签→位值映射从纯静态数组升级为 DB 持久化 + 启动自动同步 + 运行时查缓存，实现前后端从 API 获取位表的完整链路。

**Architecture:** 新增 `sys_permission_values` 表存储标签→位映射。后端 `onDatabaseReady` 钩子中执行差异同步（新增追加、废弃标记）。前端 `app.mount()` 前调 API 获取位表存入运行时缓存。`buildPerValue` 两端统一改查缓存。`definePageConfig` 改为延迟计算（只存字符串，路由守卫时懒填充）。

**Tech Stack:** NestJS + TypeORM (MySQL), Vue 3 + Vue Router, bigint 位运算

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `packages/base/src/backend/modules/sys/permission/entities/permission-value.entity.ts` | 创建 | PermissionValue 实体 |
| `packages/base/src/backend/modules/sys/permission/permission-value-sync.service.ts` | 创建 | 启动同步 + 缓存管理 |
| `packages/base/src/backend/modules/sys/permission/permission.module.ts` | 修改 | 注册新实体 + 新服务 |
| `packages/base/src/backend/modules/sys/permission/permission.controller.ts` | 修改 | 新增 `GET /permissions/values` 端点 |
| `packages/base/src/backend/common/constants/permissions.ts` | 修改 | `buildPerValue` 改查缓存 + `initPermissionValueCache` |
| `packages/base/src/backend/create-base-backend-app.ts` | 修改 | 插入默认 `onDatabaseReady` 钩子 |
| `packages/base/src/backend/database/seeds/index.ts` | 修改 | 新增 PermissionValue 种子数据 |
| `packages/base/tsconfig.test.json` | 修改 | include 新实体 |
| `packages/base/src/frontend/utils/permissions.ts` | 修改 | `buildPerValue` 改查缓存 + `initPermissionCache` |
| `packages/base/src/frontend/router/routes.ts` | 修改 | `definePageConfig` 延迟计算 |
| `packages/base/src/frontend/router/guard.ts` | 修改 | 路由守卫懒填充 `permissionValue` |
| `packages/base/src/frontend/create-base-admin-app.ts` | 修改 | 暴露 `fetchPermissionValues`/`initPermissionCache` + mount 前执行 |
| `frontend/src/main.ts` | 修改 | mount 前调 `fetchPermissionValues` |

---

### Task 1: 创建 PermissionValue 实体

**Files:**
- Create: `packages/base/src/backend/modules/sys/permission/entities/permission-value.entity.ts`

- [ ] **Step 1: 编写实体代码**

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('sys_permission_values')
@Unique(['name'])
@Unique(['bitPosition'])
export class PermissionValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  name: string;

  @Column({ name: 'bit_position', type: 'int' })
  bitPosition: number;

  @Column({ name: 'bit_value', type: 'bigint', unsigned: true })
  bitValue: bigint;

  @Column({ type: 'varchar', length: 32, default: 'builtin' })
  source: string;

  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

- [ ] **Step 2: 在 permission.module.ts 注册实体**

修改 `packages/base/src/backend/modules/sys/permission/permission.module.ts`，在 `TypeOrmModule.forFeature` 中添加 `PermissionValue`：

```typescript
import { PermissionValue } from './entities/permission-value.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission, PermissionValue]),
  ],
  // ...
})
```

---

### Task 2: 创建 PermissionValueSyncService

**Files:**
- Create: `packages/base/src/backend/modules/sys/permission/permission-value-sync.service.ts`
- Modify: `packages/base/src/backend/modules/sys/permission/permission.module.ts`

- [ ] **Step 1: 编写同步服务**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PermissionValue } from './entities/permission-value.entity';
import { getPermissionValues, initPermissionValueCache } from '../../../common/constants/permissions';

@Injectable()
export class PermissionValueSyncService {
  private readonly logger = new Logger(PermissionValueSyncService.name);

  constructor(
    @InjectRepository(PermissionValue)
    private repo: Repository<PermissionValue>,
  ) {}

  async sync(dataSource: DataSource): Promise<void> {
    const declaredNames = new Set(getPermissionValues());
    const existing = await this.repo.find({ where: { status: 1 } });
    const existingNames = new Set(existing.map(e => e.name));

    // 废弃：代码中不再引用的标签
    const deprecated = existing.filter(e => !declaredNames.has(e.name));
    if (deprecated.length > 0) {
      await this.repo.update(
        deprecated.map(e => e.id),
        { status: 0 },
      );
      this.logger.log(`标记废弃 ${deprecated.length} 个权限标签: ${deprecated.map(e => e.name).join(', ')}`);
    }

    // 新增：代码声明但 DB 中没有的标签
    const added = [...declaredNames].filter(n => !existingNames.has(n));
    if (added.length > 0) {
      const maxBit = await this.repo
        .createQueryBuilder('pv')
        .select('MAX(pv.bitPosition)', 'max')
        .getRawOne()
        .then(r => r?.max ?? -1);

      const newEntities = added.map((name, i) => {
        const bitPosition = maxBit + 1 + i;
        return this.repo.create({
          name,
          bitPosition,
          bitValue: 1n << BigInt(bitPosition),
          source: 'business',
          status: 1,
        });
      });

      await dataSource.transaction(async (manager) => {
        for (const entity of newEntities) {
          try {
            await manager.save(entity);
          } catch (err: any) {
            if (err?.code === 'ER_DUP_ENTRY') {
              this.logger.warn(`标签 "${entity.name}" (bitPosition=${entity.bitPosition}) 已存在，跳过`);
            } else {
              throw err;
            }
          }
        }
      });

      this.logger.log(`新增 ${newEntities.length} 个权限标签: ${added.join(', ')}`);
    }

    // 加载全量 active 记录到内存缓存
    const allActive = await this.repo.find({ where: { status: 1 }, order: { bitPosition: 'ASC' } });
    initPermissionValueCache(allActive.map(e => ({ name: e.name, bitValue: e.bitValue })));
    this.logger.log(`权限值缓存已初始化 (${allActive.length} 个标签)`);
  }
}
```

- [ ] **Step 2: 在 permission.module.ts 注册服务**

```typescript
import { PermissionValueSyncService } from './permission-value-sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission, PermissionValue]),
  ],
  providers: [PermissionService, PermissionValueSyncService],
  controllers: [PermissionController],
  exports: [PermissionService, PermissionValueSyncService],
})
export class PermissionModule {}
```

---

### Task 3: 改造后端 buildPerValue + 新增缓存函数

**Files:**
- Modify: `packages/base/src/backend/common/constants/permissions.ts`

- [ ] **Step 1: 新增全局缓存 + `initPermissionValueCache` + 改造 `buildPerValue`**

在文件末尾（`getPermissionOptions` 之后）添加：

```typescript
/**
 * 运行时权限值缓存（name → bitValue）
 * 由 PermissionValueSyncService 在 onDatabaseReady 后填充
 */
let permissionValueCache: Map<string, bigint> = new Map();

export function initPermissionValueCache(values: Array<{ name: string; bitValue: bigint }>): void {
  permissionValueCache = new Map(values.map(v => [v.name, v.bitValue]));
}

export function getPermissionValueCache(): Map<string, bigint> {
  return permissionValueCache;
}
```

- [ ] **Step 2: 改造 `buildPerValue` 为查缓存优先**

修改 `buildPerValue` 函数（L107–118），改为优先查缓存、fallback 静态数组：

```typescript
export function buildPerValue(names: string[]): bigint {
  if (permissionValueCache.size > 0) {
    let result = 0n;
    for (const name of names) {
      const value = permissionValueCache.get(name);
      if (value === undefined) {
        throw new Error(`未知的权限名称：${name}`);
      }
      result |= value;
    }
    return result;
  }

  // fallback: 首次启动 DB 未就绪时用静态数组
  const values = getPermissionValues();
  let result = 0n;
  for (const name of names) {
    const index = values.indexOf(name);
    if (index === -1) {
      throw new Error(`未知的权限名称：${name}，可用值：${values.join(', ')}`);
    }
    result |= (1n << BigInt(index));
  }
  return result;
}
```

---

### Task 4: 后端 API 端点

**Files:**
- Modify: `packages/base/src/backend/modules/sys/permission/permission.controller.ts`

- [ ] **Step 1: 在 controller 中新增 `GET /permissions/values` 端点**

在 controller 顶部导入 `SkipPermission`：

```typescript
import { SkipPermission } from '../../../common/decorators/skip-permission.decorator';
```

在任意现有端点之间添加：

```typescript
@Get('values')
@SkipPermission()
@ApiOperation({ summary: '获取权限值标签映射表', description: '返回所有活跃的权限值标签及其位运算值' })
@ApiResponse({ status: 200, description: '查询成功' })
async getPermissionValues() {
  const { getPermissionValueCache } = await import('../../../common/constants/permissions');
  const cache = getPermissionValueCache();
  if (cache.size === 0) {
    // fallback：DB 未就绪时用静态数组
    const { getPermissionValues, buildPerValue } = await import('../../../common/constants/permissions');
    const values = getPermissionValues();
    return values.map((name, index) => ({
      name,
      bitPosition: index,
      bitValue: (1n << BigInt(index)).toString(),
    }));
  }
  const result: Array<{ name: string; bitPosition: number; bitValue: string }> = [];
  let pos = 0;
  for (const [name, bitValue] of cache) {
    result.push({ name, bitPosition: pos++, bitValue: bitValue.toString() });
  }
  return result;
}
```

---

### Task 5: createBaseBackendApp 注入 onDatabaseReady 钩子

**Files:**
- Modify: `packages/base/src/backend/create-base-backend-app.ts`

- [ ] **Step 1: 导入 PermissionValueSyncService**

在文件顶部已有 import 附近添加：

```typescript
import { PermissionValueSyncService } from './modules/sys/permission/permission-value-sync.service';
```

- [ ] **Step 2: 在 createBaseBackendApp 内部注册默认钩子**

找到 `HooksExecutor` 的调用处，在业务层 `onDatabaseReady` 之后追加默认同步逻辑。具体位置在 `setupHooks` 或 `HooksExecutor` 相关代码附近。逻辑为：

```typescript
// 在 hooksExecutor 执行用户钩子之后
const syncService = app.get(PermissionValueSyncService);
await syncService.sync(dataSource);
```

---

### Task 6: 种子数据

**Files:**
- Modify: `packages/base/src/backend/database/seeds/index.ts`

- [ ] **Step 1: 导入 PermissionValue 实体**

```typescript
import { PermissionValue } from '../../modules/sys/permission/entities/permission-value.entity';
```

- [ ] **Step 2: 新增种子函数**

```typescript
async function seedPermissionValues(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(PermissionValue);
  const existing = await repo.count();
  if (existing > 0) return;

  const builtin = [
    { name: '添加', bitPosition: 0 },
    { name: '编辑', bitPosition: 1 },
    { name: '删除', bitPosition: 2 },
    { name: '导出', bitPosition: 3 },
    { name: '导入', bitPosition: 4 },
    { name: '审批', bitPosition: 5 },
    { name: '拒绝', bitPosition: 6 },
    { name: '发布', bitPosition: 7 },
    { name: '归档', bitPosition: 8 },
  ];

  for (const item of builtin) {
    await repo.insert({
      name: item.name,
      bitPosition: item.bitPosition,
      bitValue: 1n << BigInt(item.bitPosition),
      source: 'builtin',
      status: 1,
    });
  }
  process.stdout.write(`   ✅ 写入 ${builtin.length} 个内置权限标签\n`);
}
```

- [ ] **Step 3: 在 runSeeds 中调用**

在 `runSeeds` 函数中合适位置（权限种子之后）添加：

```typescript
// 9. 初始化权限值位表
await seedPermissionValues(dataSource);
```

---

### Task 7: 改造前端 buildPerValue + initPermissionCache

**Files:**
- Modify: `packages/base/src/frontend/utils/permissions.ts`

- [ ] **Step 1: 新增运行时缓存 + `initPermissionCache`**

在文件顶部（`PERMISSION_VALUES` 定义之后）添加：

```typescript
/**
 * 运行时权限值缓存（从 API 获取，name → bitValue）
 */
let permissionValueCache: Map<string, bigint> = new Map();

export function initPermissionCache(values: Array<{ name: string; bitValue: string }>): void {
  permissionValueCache = new Map(values.map(v => [v.name, BigInt(v.bitValue)]));
}

export function getPermissionValueCache(): Map<string, bigint> {
  return permissionValueCache;
}
```

- [ ] **Step 2: 改造 `buildPerValue` 为查缓存优先**

修改 `buildPerValue` 函数（L165–175）：

```typescript
export function buildPerValue(names: string[]): bigint {
  if (permissionValueCache.size > 0) {
    let result = 0n;
    for (const name of names) {
      const value = permissionValueCache.get(name);
      if (value === undefined) {
        console.warn(`[permissions] 未知的权限名称：${name}，回退到静态计算`);
        break;
      }
      result |= value;
    }
    if (result !== 0n || names.length === 0) return result;
    // 如果缓存未命中全部，回退到静态计算
  }

  // fallback: 静态数组计算
  let result = 0n;
  for (const name of names) {
    const index = PERMISSION_VALUES.indexOf(name);
    if (index === -1) {
      throw new Error(`未知的权限名称：${name}，可用值：${PERMISSION_VALUES.join(', ')}`);
    }
    result |= (1n << BigInt(index));
  }
  return result;
}
```

同样改造同一文件中的 `getPermValue`、`parsePerValue`、`hasPermission` 在缓存可用时优先查缓存：

```typescript
// getPermValue 改：
export function getPermValue(name: string): bigint {
  const cached = permissionValueCache.get(name);
  if (cached !== undefined) return cached;

  const index = PERMISSION_VALUES.indexOf(name);
  if (index === -1) throw new Error(`未知的权限名称：${name}`);
  return 1n << BigInt(index);
}

// hasPermission 改：
export function hasPermission(value: string, name: string): boolean {
  const cached = permissionValueCache.get(name);
  if (cached !== undefined) {
    return (BigInt(value) & cached) !== 0n;
  }
  const index = PERMISSION_VALUES.indexOf(name);
  if (index === -1) return false;
  return (BigInt(value) & (1n << BigInt(index))) !== 0n;
}

// parsePerValue 改（缓存时遍历缓存 entries）：
export function parsePerValue(value: string): string[] {
  const bigValue = BigInt(value);
  const result: string[] = [];

  if (permissionValueCache.size > 0) {
    for (const [name, bitValue] of permissionValueCache) {
      if ((bigValue & bitValue) !== 0n) {
        result.push(name);
      }
    }
    return result;
  }

  for (let i = 0; i < PERMISSION_VALUES.length; i++) {
    if ((bigValue & (1n << BigInt(i))) !== 0n) {
      result.push(PERMISSION_VALUES[i]);
    }
  }
  return result;
}
```

---

### Task 8: definePageConfig 延迟计算

**Files:**
- Modify: `packages/base/src/frontend/router/routes.ts`

- [ ] **Step 1: 修改 `definePageConfig`，不再立即计算 `permissionValue`**

修改 L90–97：

```typescript
export function definePageConfig<T extends string = PermissionName>(
  config: PageConfig<T>
): PageConfig<T> & { permissionValue?: bigint } {
  return {
    ...config,
    permissionValue: undefined,
  };
}
```

- [ ] **Step 2: 修改路由构建，在 `meta` 中保留 `permissions` 字符串数组**

找到路由构建处（L160–170 附近），在 `meta` 中新增 `permissions` 字段：

```typescript
meta: {
  // ... 现有 meta 字段
  permissions: config.permissions,
  permissionValue: config.permissionValue?.toString(),
}
```

---

### Task 9: 路由守卫懒填充

**Files:**
- Modify: `packages/base/src/frontend/router/guard.ts`

- [ ] **Step 1: 在权限检查前懒填充 `permissionValue`**

在路由守卫权限检查逻辑之前（`checkRouteInMenu` 调用之前）插入：

```typescript
// 懒填充 permissionValue（首次访问该路由时从 permissions 字符串数组计算）
if (to.meta.permissions && !to.meta.permissionValue) {
  try {
    const { buildPerValue } = await import('../utils/permissions');
    to.meta.permissionValue = buildPerValue(to.meta.permissions as string[]).toString();
  } catch (e) {
    console.warn('[guard] 权限值计算失败，使用回退:', e);
  }
}
```

---

### Task 10: createBaseAdminApp 暴露 pre-mount API

**Files:**
- Modify: `packages/base/src/frontend/create-base-admin-app.ts`

- [ ] **Step 1: 扩展 `BaseAdminAppInstance` 返回类型**

找到 `BaseAdminAppInstance` 类型定义（或在文件内定义），新增方法：

```typescript
export interface BaseAdminAppInstance {
  app: App;
  mount: (selector: string | Element) => Promise<void>;
  router: Router;
  pinia: Pinia;
  fetchPermissionValues: () => Promise<Array<{ name: string; bitValue: string }>>;
  initPermissionCache: (values: Array<{ name: string; bitValue: string }>) => void;
}
```

- [ ] **Step 2: 实现 fetchPermissionValues + initPermissionCache**

在 `mount` 方法之前，向返回对象添加：

```typescript
async function fetchPermissionValues() {
  const baseUrl = instance.config.globalProperties.$apiBaseUrl || '';
  const res = await fetch(`${baseUrl}/api/permissions/values`);
  if (!res.ok) throw new Error(`获取权限值表失败: ${res.status}`);
  return res.json();
}

function initPermissionCache(values: Array<{ name: string; bitValue: string }>) {
  const { initPermissionCache: setCache } = require('../utils/permissions');
  setCache(values);
}
```

将这些方法追加到 `return` 语句的对象中。

---

### Task 11: 前端 main.ts 调用

**Files:**
- Modify: `frontend/src/main.ts`

- [ ] **Step 1: 在 `createBaseAdminApp` 和 `mount` 之间插入权限值获取**

```typescript
const admin = createBaseAdminApp({
  title: '墨焱前端演示',
  routes: [...businessRoutes, ...adTypeRoutes, ...adPlacementRoutes],
  // ...
});

try {
  const values = await admin.fetchPermissionValues();
  admin.initPermissionCache(values);
} catch (e) {
  console.warn('[main] 获取权限值表失败，将使用静态回退:', e);
}

await admin.mount('#app');
```

注意：`mount` 改为 `await admin.mount('#app')`（当前不是 await）。

---

### Task 12: 类型检查 + 验证

**Files:** 无新增

- [ ] **Step 1: 运行类型检查**

```bash
pnpm typecheck
```

预期：零错误。如有错误修复。

- [ ] **Step 2: 运行种子数据**

启动后端，观察日志输出：
```
🌱 开始执行种子数据...
   ✅ 写入 9 个内置权限标签
```

- [ ] **Step 3: 验证 API 端点**

```bash
curl http://localhost:3000/api/permissions/values
```

预期返回类似：
```json
[
  { "name": "添加", "bitPosition": 0, "bitValue": "1" },
  { "name": "编辑", "bitPosition": 1, "bitValue": "2" },
  ...
]
```

- [ ] **Step 4: 验证权限校验**

创建角色，分配权限，调用需要权限的 API，确认 200。

---

## 验证清单

- [ ] `pnpm typecheck` 零错误
- [ ] 种子数据正确写入 `sys_permission_values`
- [ ] `GET /api/permissions/values` 返回正确标签位表
- [ ] 新增标签后重启 → 自动追加到 DB
- [ ] 废弃标签后重启 → 标记 status=0
- [ ] 前端 `app.mount()` 前成功获取位表
- [ ] 页面路由级别权限正常（菜单可见/不可见）
- [ ] 按钮级别权限正常（`v-permission` + `usePermission`）
- [ ] 降级：API 失败时静态 fallback 仍可工作

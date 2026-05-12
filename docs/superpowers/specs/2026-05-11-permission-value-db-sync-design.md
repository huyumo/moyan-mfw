# 权限值 DB 同步方案设计

## 概述

将当前纯静态数组驱动的权限标签→位值映射，升级为 DB 持久化 + 启动自动同步 + 运行时查缓存。实现扩展包与业务层去中心化声明权限标签、框架层统一收集编排、append-only 位值分配、前后端从 API 获取位表的完整链路。

---

## 1. 设计目标

| 目标 | 现状 | 目标 |
|------|------|------|
| 标签→位值存储 | 编译时静态 `PERMISSION_VALUES` 数组 | DB `sys_permission_values` 表持久化 |
| 位值分配 | 数组位置隐式决定 | DB `bit_position` 显式记录，append-only |
| 标签变化感知 | 无 | 启动时检测增减，废弃标记不删除 |
| 前端获取位表 | 编译时自算 | `app.mount()` 前调 API 获取运行时缓存 |
| `buildPerValue` 实现 | `PERMISSION_VALUES.indexOf(name)` | `permissionValueCache.get(name)` |
| 新增标签生效 | 前后端各自改源文件 | 启动时自动同步，刷新即生效 |

---

## 2. DB 层

### 2.1 `sys_permission_values` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `CHAR(36) PK` | UUID 主键 |
| `name` | `VARCHAR(64) UNIQUE` | 标签名，如 '添加'、'扣款' |
| `bit_position` | `INT UNIQUE` | 位索引，0,1,2... |
| `bit_value` | `BIGINT UNSIGNED` | `1n << bit_position` |
| `source` | `VARCHAR(32)` | builtin / business / extension |
| `status` | `TINYINT DEFAULT 1` | 1=active, 0=deprecated |
| `created_at` | `DATETIME` | 创建时间 |

```sql
CREATE TABLE sys_permission_values (
  id           CHAR(36) NOT NULL,
  name         VARCHAR(64) NOT NULL,
  bit_position INT NOT NULL,
  bit_value    BIGINT UNSIGNED NOT NULL,
  source       VARCHAR(32) DEFAULT 'builtin',
  status       TINYINT DEFAULT 1,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_name (name),
  UNIQUE KEY uk_bit_position (bit_position)
);
```

### 2.2 位值分配规则（append-only）

- **初始化**：首次建表时写入 `bit_position 0–8` 的内置标签（`'添加','编辑','删除','导出','导入','审批','拒绝','发布','归档'`），与现有 `DEFAULT + EXTENSION_PERMISSION_VALUES` 索引完全一致
- **新增**：新标签追加到 `max(bit_position) + 1`
- **废弃**：代码中不再引用的标签 → `UPDATE status = 0`（不删除记录，不回收 bit_position）
- **永不修改已分配的 bit_position**

---

## 3. 后端实现

### 3.1 实体

新增 `packages/base/src/backend/modules/sys/permission/entities/permission-value.entity.ts`：

```typescript
@Entity('sys_permission_values')
export class PermissionValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  name: string;

  @Column({ name: 'bit_position', type: 'int', unique: true })
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

### 3.2 启动同步服务

`PermissionValueSyncService` 在 `onDatabaseReady` 钩子中执行：

```
syncPermissionValues(dataSource):
  1. repo = dataSource.getRepository(PermissionValue)
  2. declaredNames = getPermissionValues()  // 收集代码中所有标签
  3. existing = SELECT * WHERE status = 1
  4. diff:
     - ADDED = declaredNames - existing → INSERT (bitPosition = maxBit + 1)
     - DEPRECATED = existing - declaredNames → UPDATE status = 0
  5. 加载全量 active 记录到内存：
     permissionValueCache = Map<string, bigint>  // name → bitValue
```

- 多实例并发：`name` + `bit_position` UNIQUE 约束配合 `INSERT ... ON DUPLICATE KEY UPDATE` 或在 TypeORM 中用 `save` + try/catch 安全跳过
- 幂等：相同 name 的重复 INSERT 被 UNIQUE 约束阻止，不产生副作用

### 3.3 全局内存缓存

```typescript
// packages/base/src/backend/common/constants/permissions.ts

let permissionValueCache: Map<string, bigint> = new Map()

export function initPermissionValueCache(values: Array<{ name: string; bitValue: bigint }>) {
  permissionValueCache = new Map(values.map(v => [v.name, v.bitValue]))
}

export function buildPerValue(names: string[]): bigint {
  let result = 0n
  for (const name of names) {
    const value = permissionValueCache.get(name)
    if (value === undefined) {
      throw new Error(`未知的权限名称：${name}`)
    }
    result |= value
  }
  return result
}
```

首次启动时若 DB 为空（缓存未填充），fallback 用静态 `getPermissionValues()` 数组计算。

### 3.4 API 端点

`GET /api/system/permission-values`（在 base-backend system controller 中新增）：

```typescript
@Get('permission-values')
@SkipPermission()
async getPermissionValues() {
  return permissionValueCache  // 或转为 [{ name, bitPosition, bitValue }] 格式
}
```

### 3.5 `onDatabaseReady` 注册

在 `createBaseBackendApp` 中插入默认钩子（业务层 `hooks.onDatabaseReady` 之后执行）：

```typescript
const defaultOnDatabaseReady = async (ctx: AppContext) => {
  await syncPermissionValues(ctx.dataSource)
}
```

### 3.6 种子数据

`seeds/index.ts` 中新增对 `PermissionValue` 的种子初始化，写入 `bit_position 0–8` 的内置标签，确保首次建表有数据。

---

## 4. 前端实现

### 4.1 `app.mount()` 前获取位表

`createBaseAdminApp` 在路由构建完成后、挂载前暴露一个异步钩子：

```typescript
// frontend/src/main.ts
const admin = createBaseAdminApp({
  routes: [...businessRoutes, ...adTypeRoutes, ...adPlacementRoutes],
  // ...其他配置
})

// 1. 调 API 获取位表
await admin.fetchPermissionValues()  // GET /api/system/permission-values

// 2. 存入运行时缓存
admin.initPermissionCache(response)

// 3. 此时才挂载
admin.mount('#app')
```

### 4.2 运行时缓存

```typescript
// packages/base/src/frontend/utils/permissions.ts

let permissionValueCache: Map<string, bigint> = new Map()

export function initPermissionCache(values: Array<{ name: string; bitValue: string }>) {
  permissionValueCache = new Map(values.map(v => [v.name, BigInt(v.bitValue)]))
}

export function buildPerValue(names: string[]): bigint {
  let result = 0n
  for (const name of names) {
    const value = permissionValueCache.get(name)
    if (value === undefined) {
      throw new Error(`未知的权限名称：${name}`)
    }
    result |= value
  }
  return result
}
```

### 4.3 `definePageConfig` 延迟计算

```typescript
// packages/base/src/frontend/router/routes.ts

export function definePageConfig(config: PageConfig) {
  return {
    ...config,
    permissionValue: undefined,  // 延迟到路由守卫
  }
}
```

路由 `meta` 中保留 `permissions` 字符串数组（原样透传）：

```typescript
meta: {
  permissions: config.permissions,  // ['添加', '编辑', '删除']
  permissionValue: undefined,
}
```

### 4.4 路由守卫懒填充

路由守卫首次解析时填充 `permissionValue`：

```typescript
// guard.ts

function resolvePermissionValue(route) {
  if (route.meta.permissions && !route.meta.permissionValue) {
    route.meta.permissionValue = buildPerValue(route.meta.permissions).toString()
  }
}
```

`v-permission` 和 `usePermission` 内部调用 `buildPerValue` 时查运行时缓存（已在 `app.mount()` 前填充）。

### 4.5 降级处理

若 API 调用失败（网络异常等），fallback 用静态 `PERMISSION_VALUES` 数组 + `indexOf` 计算，保证页面对不依赖新标签的场景仍然可用。

---

## 5. 数据流总览

```
启动时（后端）                           启动时（前端）
─────────────                           ─────────────
1. main.ts 收集所有标签                  1. createBaseAdminApp 构建路由
   registerPermissionValues(combined)    2. GET /api/system/permission-values
2. onDatabaseReady:                        → initPermissionCache(response)
   ├─ diff declared vs DB                3. app.mount('#app')
   ├─ INSERT 新增 → append bit           4. 路由守卫首次触发：
   ├─ UPDATE 废弃 → status=0                → buildPerValue(['添加','编辑'])
   └─ 加载 active → permissionValueCache    → 查缓存 → bigint
3. GET /api/system/permission-values      5. v-permission / usePermission：
   → 返回 [{ name, bit_value }]             → 查同一缓存
4. buildPerValue → 查 permissionValueCache
5. PermissionGuard → 同左
```

---

## 6. 兼容性保证

| 关注点 | 措施 |
|--------|------|
| `bit_position 0–8` 与现有索引一致 | 种子数据显式写入，后续追加 `max+1` |
| 已有 `sys_role_permissions` 数据 | 不受影响，bitPosition 不变则 bigint 语义不变 |
| 已有 `sys_permissions.permissionValue` | 不变，两表独立 |
| 前端 API 失败 | fallback 静态数组计算 |
| 多实例并发启动 | UNIQUE 约束阻止重复写入 |

---

## 7. 变更文件清单

| 层级 | 文件 | 操作 |
|------|------|------|
| DB | migration `*_permission_values.init.ts` | 新增 |
| 后端-实体 | `permission-value.entity.ts` | 新增 |
| 后端-服务 | `permission-value-sync.service.ts` | 新增 |
| 后端-API | `system.controller.ts` 新增 `GET /permission-values` | 修改 |
| 后端-核心 | `create-base-backend-app.ts` → 默认 `onDatabaseReady` 钩子 | 修改 |
| 后端-核心 | `permissions.ts` → `buildPerValue` 改查缓存 | 修改 |
| 后端-种子 | `seeds/index.ts` → 新增 `PermissionValue` 种子 | 修改 |
| 前端-核心 | `permissions.ts` → `buildPerValue` 改查缓存 + `initPermissionCache` | 修改 |
| 前端-核心 | `routes.ts` → `definePageConfig` 延迟计算 | 修改 |
| 前端-核心 | `guard.ts` → 路由守卫懒填充 | 修改 |
| 前端-入口 | `create-base-admin-app.ts` → 暴露 pre-mount 钩子 | 修改 |
| 前端-入口 | `main.ts` → mount 前调 API | 修改 |

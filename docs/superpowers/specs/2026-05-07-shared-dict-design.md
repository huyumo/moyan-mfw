# moyan-shared-dict 共享字典方案设计规格

> 版本: v2.1  
> 日期: 2026-05-07  
> 作者: Agent  
> 状态: Implemented ✅

---

## 1. 背景与目标

### 1.1 当前问题

| 问题 | 现状 |
|------|------|
| 前后端字段定义分散 | 后端 Entity 中用注释描述枚举取值范围；前端各页面内联 `DictItem[]` 常量 |
| 字典渲染不统一 | 部分页面用 `MfwDictFormat`，部分硬编码 `el-tag` / 文本；`DictItem[]` 定义在各业务页面 |
| 无单一数据源 | 修改一个字典值需同步改：后端注释、前端 `DictItem[]`、seed 数据 |
| 类型不一致 | `isDeveloper` 后端 `number` → DTO `boolean` → 前端 `boolean ? 1 : 0` 来回转换 |
| 数据库无字典表 | 后端无法用 JOIN 查询获取标签文本，无法做字典驱动的动态逻辑 |

### 1.2 目标

1. **单一数据源**：一份字典定义，前后端及数据库共享
2. **统一渲染**：所有字典字段统一使用 `MfwDictFormat` 组件 + `toItems()` 获取数据
3. **数据库同步**：通过 seeder 将字典导入 `sys_dict_types` / `sys_dict_items` 表，支持 JOIN 查询
4. **零依赖共享包**：框架包 `moyan-shared-dict` 不依赖 Vue、NestJS、TypeORM、Element Plus 等任何业务框架
5. **三层分层管理**：
   - `packages/shared-dict/base/` → 框架内置通用字典（可发布到 npm）
   - `business-dict/src/` → 本项目业务字典（private，不发布）
   - 消费者 `src/dicts/` → npm 用户自定义业务字典（不发布）

### 1.3 设计原则

- **注解 + 静态类**：每个字典是一个 `@DictMeta` 装饰的静态类，每个字典项是一个 `@DictEntry` 装饰的静态属性
- **自动注册**：`@DictMeta` 装饰器自动将类注册到全局注册表，seeder 通过 `getAllDicts()` 发现所有字典
- **最小侵入**：新增字典只需添加一个静态类，无需修改 seeder 或注册逻辑

---

## 2. 架构总览

```
┌─ moyan-shared-dict (packages/shared-dict/  → npm 发布) ─────┐
│                                                               │
│  core/                   base/                                │
│  ├── types.ts            ├── status.ts   (StatusDict)         │
│  ├── decorator.ts        └── index.ts    (BoolDict)           │
│  ├── helper.ts                                                │
│  ├── registry.ts     ← 全局单例 Map，收集所有注册的字典        │
│  └── index.ts                                                 │
│                                                               │
│  依赖: reflect-metadata (运行时)                               │
│  无其他业务依赖                                                │
└───────────────────────────────────────────────────────────────┘
         │                    │                    │
         │ import { DictMeta }│                    │ import { DictMeta }
         ▼                    ▼                    ▼
  ┌─ base-frontend ──┐ ┌─ business-dict ─┐ ┌─ 消费者 src/dicts/ ─┐
  │ toItems()        │ │ (根层级,不发布) │ │ (自定义,不发布)      │
  │ MfwDictFormat    │ │ GenderDict      │ │ OrderStatusDict      │
  └──────────────────┘ │ DeveloperDict   │ │ PaymentMethodDict    │
                       └─────────────────┘ └──────────────────────┘
         │                    │                    │
         │    registerDict() 写入 同一个 全局 Map (单例)        │
         ▼                    ▼                    ▼
  ┌─ base-backend ──────────────────────────────────────────────┐
  │ getAllDicts() → seeder → sys_dict_types / sys_dict_items    │
  │ Entity @Column({ comment: toDescription(GenderDict) })      │
  │ JOIN 查询字典表                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## 3. 目录结构

### 3.1 框架层 — `packages/shared-dict/`（发布到 npm）

```
packages/shared-dict/
├── package.json              # name: "moyan-shared-dict"
├── tsconfig.json
└── src/
    ├── core/
    │   ├── types.ts           # DictItem, DictMetaOptions 等类型
    │   ├── decorator.ts       # @DictMeta, @DictEntry 装饰器
    │   ├── helper.ts          # toItems, getLabel, toDescription, toDbItems
    │   ├── registry.ts        # registerDict, getAllDicts
    │   └── index.ts           # 统一导出 core 全部内容
    ├── base/
    │   ├── status.ts          # StatusDict, BoolDict（框架内置通用字典）
    │   └── index.ts
    └── index.ts               # 顶层统一导出
```

### 3.2 业务层 — `business-dict/`（private，不发布）

```
business-dict/                 ← 与 backend/、frontend/ 同级目录
├── package.json               # name: "business-dict", "private": true
├── tsconfig.json
└── src/
    ├── user.ts                # GenderDict, DeveloperDict
    ├── supplier.ts            # SupplierStatusDict（示例）
    └── index.ts               # barrel export → import 时触发所有装饰器
```

### 3.3 消费者扩展 — 任意项目 `src/dicts/`（不发布）

```
consumer-project/
└── src/
    └── dicts/
        ├── order.ts           # @DictMeta → registerDict() 写入同一全局 Map
        └── index.ts
```

---

## 4. 核心 API 设计

### 4.1 `core/types.ts` — 类型定义

```typescript
export interface DictItem {
  value: string | number
  label: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

export interface DictMetaOptions {
  key: string           // 唯一标识，如 'gender'、'status'
  label: string         // 字典中文名
  module?: string       // 所属业务模块，如 '用户管理'
}
```

### 4.2 `core/decorator.ts` — 装饰器

**依赖**: `reflect-metadata`

```typescript
import type { DictMetaOptions, DictItem } from './types'

/**
 * 装饰字典类。
 * - 注入元信息 (key, label, module)
 * - 自动调用 registerDict() 加入全局注册表
 */
export function DictMeta(options: DictMetaOptions): ClassDecorator

/**
 * 装饰字典项静态属性。
 * - 注入 (label, type) 元信息
 * - value 由静态属性的实际值提供
 */
export function DictEntry(item: Omit<DictItem, 'value'>): PropertyDecorator
```

**内部实现要点**：
- 使用 `Reflect.defineMetadata(Symbol('dict:meta'), ...)` 存储类级元信息
- 使用 `Reflect.defineMetadata(Symbol('dict:items'), ...)` 存储条目元信息
- `@DictMeta` 内部调用 `registerDict(target)` 自动注册

### 4.3 `core/helper.ts` — 工具函数

```typescript
import type { DictItem, DictMetaOptions } from './types'

/**
 * 从静态类提取 DictItem[]，供前端 MfwDictFormat 使用。
 *
 * @example
 * toItems(GenderDict)  // [{ value: 0, label: '未知', type: 'info' }, ...]
 */
export function toItems<T>(dictClass: T): DictItem[]

/**
 * 根据值获取标签文本。
 *
 * @example
 * getLabel(GenderDict, 2)  // '女'
 */
export function getLabel<T>(dictClass: T, value: string | number): string

/**
 * 获取字典元信息 (key, label, module)。
 */
export function getMeta<T>(dictClass: T): DictMetaOptions | undefined

/**
 * 生成描述文本，用于数据库 Entity @Column({ comment: ... })。
 *
 * @example
 * toDescription(GenderDict)  // '性别: 0=未知, 1=男, 2=女'
 */
export function toDescription<T>(dictClass: T): string

/**
 * 获取纯数据项 (不含 type 等 UI 字段)，用于数据库写入。
 *
 * @example
 * toDbItems(GenderDict)  // [{ value: 0, label: '未知' }, ...]
 */
export function toDbItems<T>(dictClass: T): Array<{ value: string | number; label: string }>
```

### 4.4 `core/registry.ts` — 全局注册表

```typescript
import { META_KEY, ITEMS_KEY } from './decorator'
import type { DictItem, DictMetaOptions } from './types'

const registry = new Map<string, any>()

/**
 * 由 @DictMeta 内部调用，注册字典类引用。
 * 不对外暴露，仅通过 getAllDicts() 消费。
 */
export function registerDict(dictClass: any): void {
  registry.set(dictClass.name, dictClass)
}

/**
 * 获取所有已注册字典的完整信息。
 * 供 seeder 使用，一次调用即可获取全部字典数据。
 *
 * 实现要点：直接读取 metadata，无需依赖 helper.ts，避免循环引用。
 *
 * @returns { key, label, module, items }[]
 */
export function getAllDicts(): Array<{
  key: string
  label: string
  module?: string
  items: DictItem[]
}> {
  return Array.from(registry.values()).map(cls => {
    const meta: DictMetaOptions | undefined = Reflect.getOwnMetadata(META_KEY, cls)
    const entries: Array<{ key: string; item: Omit<DictItem, 'value'> }> =
      Reflect.getOwnMetadata(ITEMS_KEY, cls) || []

    return {
      key: meta?.key ?? '',
      label: meta?.label ?? '',
      module: meta?.module,
      items: entries.map(({ key, item }) => ({
        ...item,
        value: cls[key],
      })),
    }
  })
}
```

**设计约束**：
- `registry.ts` 仅依赖 `decorator.ts`（获取 Symbol key），无循环依赖
- 注册表使用 `Map<string, any>`，key 为类名
- `getAllDicts()` 直接内联读取 metadata 并组装结果，不调用 `helper.ts`

---

## 5. 字典定义

### 5.1 框架内置字典 — `packages/shared-dict/src/base/status.ts`

```typescript
import { DictMeta, DictEntry } from '../core/decorator'

@DictMeta({ key: 'status', label: '通用状态' })
export class StatusDict {
  @DictEntry({ label: '启用', type: 'success' })  static ENABLED  = 1
  @DictEntry({ label: '禁用', type: 'info'   })  static DISABLED = 0
}

@DictMeta({ key: 'bool', label: '布尔值' })
export class BoolDict {
  @DictEntry({ label: '是', type: 'success' })  static YES = 1
  @DictEntry({ label: '否', type: 'info'   })  static NO  = 0
}
```

### 5.2 本项目业务字典 — `business-dict/src/user.ts`

```typescript
import { DictMeta, DictEntry } from 'moyan-shared-dict'

@DictMeta({ key: 'gender', label: '性别', module: '用户管理' })
export class GenderDict {
  @DictEntry({ label: '未知', type: 'info'    })  static UNKNOWN = 0
  @DictEntry({ label: '男',   type: 'primary' })  static MALE    = 1
  @DictEntry({ label: '女',   type: 'danger'  })  static FEMALE  = 2
}

@DictMeta({ key: 'developer', label: '开发者', module: '用户管理' })
export class DeveloperDict {
  @DictEntry({ label: '是', type: 'success' })  static YES = 1
  @DictEntry({ label: '否', type: 'info'   })  static NO  = 0
}
```

### 5.3 消费者自定义字典示例 — `src/dicts/order.ts`

```typescript
import { DictMeta, DictEntry } from 'moyan-shared-dict'

@DictMeta({ key: 'order_status', label: '订单状态', module: '订单管理' })
export class OrderStatusDict {
  @DictEntry({ label: '待支付', type: 'warning' })  static PENDING   = 0
  @DictEntry({ label: '已支付', type: 'success' })  static PAID      = 1
  @DictEntry({ label: '已取消', type: 'info'   })  static CANCELLED = 2
}
```

---

## 6. 数据库设计

### 6.1 DDL

```sql
-- 字典类型表
CREATE TABLE sys_dict_types (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  dict_key   VARCHAR(64)  NOT NULL UNIQUE,
  dict_name  VARCHAR(64)  NOT NULL,
  module     VARCHAR(64)  DEFAULT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

-- 字典项表
CREATE TABLE sys_dict_items (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  dict_type_id  CHAR(36)     NOT NULL,
  item_value    VARCHAR(64)  NOT NULL,
  item_label    VARCHAR(64)  NOT NULL,
  sort_order    INT          NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dict_type (dict_type_id),
  CONSTRAINT fk_dict_items_type FOREIGN KEY (dict_type_id) REFERENCES sys_dict_types(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
```

### 6.2 Seeder

文件位置: `packages/base-backend/src/database/seeds/dict.seeder.ts`

```typescript
import { getAllDicts } from 'moyan-shared-dict'
import type { DataSource } from 'typeorm'
import { v4 as uuid } from 'uuid'

export async function seedDicts(dataSource: DataSource) {
  const dicts = getAllDicts()

  for (const dict of dicts) {
    // upsert 字典类型
    await dataSource.query(`
      INSERT INTO sys_dict_types (id, dict_key, dict_name, module, created_at)
      VALUES (UUID(), ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE dict_name = VALUES(dict_name), module = VALUES(module)
    `, [dict.key, dict.label, dict.module ?? null])

    // 查询 type_id
    const [row] = await dataSource.query(
      `SELECT id FROM sys_dict_types WHERE dict_key = ?`, [dict.key]
    )

    // upsert 字典项
    for (let i = 0; i < dict.items.length; i++) {
      const item = dict.items[i]
      await dataSource.query(`
        INSERT INTO sys_dict_items (id, dict_type_id, item_value, item_label, sort_order, created_at)
        VALUES (UUID(), ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE item_label = VALUES(item_label), sort_order = VALUES(sort_order)
      `, [row.id, String(item.value), item.label, i])
    }
  }
}
```

**注意**：`UUID()` 函数是否为内置取决于数据库。MySQL 8.0+ 内置，低版本需使用 `REPLACE(UUID(), '-', '')`。实际实现时根据项目使用的数据库调整。

### 6.3 JOIN 查询示例

```sql
SELECT u.*, di.item_label AS gender_label
FROM sys_users u
LEFT JOIN sys_dict_items di
  ON di.dict_type_id = (SELECT id FROM sys_dict_types WHERE dict_key = 'gender')
  AND di.item_value = CAST(u.gender AS CHAR)
```

---

## 7. 后端改造

### 7.1 入口注入

`backend/src/main.ts` 顶层一行即可触发业务字典注册：

```typescript
import 'reflect-metadata'
import 'business-dict'   // ← 触发所有 @DictMeta → registerDict() 注册到全局 Map
```

执行链路：
```
import 'business-dict'
  → 加载 src/index.ts
    → 加载 src/user.ts
      → @DictMeta({ key: 'gender', ... }) → registerDict(GenderDict)
    → 加载 src/supplier.ts
      → @DictMeta({ key: 'supplier_status', ... }) → registerDict(SupplierStatusDict)

getAllDicts()
  → [StatusDict, BoolDict, GenderDict, DeveloperDict, SupplierStatusDict]
```

### 7.2 Entity 字段注释

```typescript
import { StatusDict, toDescription } from 'moyan-shared-dict'
import { GenderDict, DeveloperDict } from 'business-dict'

@Entity('sys_users')
export class User {
  @Column({
    type: 'tinyint',
    default: GenderDict.UNKNOWN,
    comment: toDescription(GenderDict),   // "性别: 0=未知, 1=男, 2=女"
  })
  gender: number

  @Column({
    type: 'tinyint',
    default: StatusDict.ENABLED,
    comment: toDescription(StatusDict),
  })
  userStatus: number

  @Column({
    type: 'tinyint',
    default: 0,
    comment: toDescription(DeveloperDict),
  })
  isDeveloper: number   // 不再转换为 boolean，统一用 number
}
```

### 7.3 DTO 校验

```typescript
import { toItems } from 'moyan-shared-dict'
import { GenderDict } from 'business-dict'
import { IsIn } from 'class-validator'

export class UpdateUserDto {
  @IsIn(toItems(GenderDict).map(i => i.value))
  gender: number
}
```

### 7.4 `isDeveloper` 类型统一

- 后端 Entity: `number` (tinyint)
- 后端 ResponseDto: `number`
- 前端 TypeScript 类型: `number`
- 前端渲染: 移除 `row.isDeveloper ? 1 : 0` 的转换逻辑

---

## 8. 前端改造

### 8.1 用户列表页改造

**改造前** (`Index.vue`):
```typescript
// 内联定义
const GENDER_DICT: DictItem[] = [
  { value: 0, label: '未知', type: 'info' },
  { value: 1, label: '男', type: 'primary' },
  { value: 2, label: '女', type: 'danger' },
];
const DEVELOPER_DICT: DictItem[] = [
  { value: 1, label: '是', type: 'success' },
  { value: 0, label: '否', type: 'info' },
];

render: ({ row }) => h(MfwDictFormat, { value: row.gender, dict: GENDER_DICT, asTag: true }),
render: ({ row }) => h(MfwDictFormat, { value: row.isDeveloper ? 1 : 0, dict: DEVELOPER_DICT, asTag: true }),
```

**改造后**:
```typescript
import { toItems } from 'moyan-shared-dict'
import { GenderDict, DeveloperDict } from 'business-dict'

render: ({ row }) => h(MfwDictFormat, { value: row.gender, dict: toItems(GenderDict), asTag: true }),
render: ({ row }) => h(MfwDictFormat, { value: row.isDeveloper, dict: toItems(DeveloperDict), asTag: true }),
```

### 8.2 搜索模板改造

```typescript
// 改前：内联 options
elProps: {
  options: [
    { label: '启用', value: STATUS.ENABLED },
    { label: '禁用', value: STATUS.DISABLED },
  ],
},

// 改后：使用 toItems()
import { StatusDict, toItems } from 'moyan-shared-dict'

elProps: {
  options: toItems(StatusDict).map(({ value, label }) => ({ value, label })),
},
```

### 8.3 状态切换改造

```typescript
// 改前
const STATUS = { ENABLED: 1, DISABLED: 0 } as const;
modelValue: row.userStatus === STATUS.ENABLED,

// 改后
import { StatusDict } from 'moyan-shared-dict'
modelValue: row.userStatus === StatusDict.ENABLED,
```

---

## 9. 迁移路径

### 9.1 Phase 1: 基础设施搭建

1. 创建 `packages/shared-dict/` 包，配置 `package.json` + `tsconfig.json`
2. 实现 `core/` 全部文件（types, decorator, helper, registry）
3. 实现 `base/status.ts` 框架内置字典（`StatusDict`、`BoolDict`）
4. 创建 `business-dict/` 业务字典目录，配置 `package.json` + `tsconfig.json`
5. 在 `pnpm-workspace.yaml` 中添加 `business-dict` workspace
6. `backend/package.json` 和 `frontend/package.json` 添加依赖：
   ```json
   { "moyan-shared-dict": "workspace:*", "business-dict": "workspace:*" }
   ```
7. 确保前后端都能正确引入

### 9.2 Phase 2: 业务字典迁移

1. 将现有内联 `DictItem[]` 迁移为 `business-dict/src/` 下的 `@DictMeta` 静态类
2. 全局搜索替换前端引用：`GENDER_DICT` → `toItems(GenderDict)`，导入源改为 `business-dict`
3. 统一 `isDeveloper` 类型为 `number`
4. 在 `backend/src/main.ts` 添加 `import 'business-dict'` 入口注入

### 9.3 Phase 3: 数据库同步

1. 创建 Migration: `sys_dict_types` + `sys_dict_items` 表
2. 实现 `dict.seeder.ts`（使用 `getAllDicts()` 自动发现所有已注册字典）
3. `backend/src/database/run-seeds.ts` 中先 `import 'business-dict'` 确保业务字典已注册，再调用 seeder

### 9.4 Phase 4: 全面推广

1. 排查项目中所有内联字典定义，逐一迁移到 `business-dict`
2. 后端 Entity 统一使用 `toDescription()` 生成 comment
3. DTO 校验统一使用 `toItems()` 生成 `@IsIn` 约束

---

## 10. 边界与约束

| 边界问题 | 处理方式 |
|---------|---------|
| **共享包零依赖** | 仅依赖 `reflect-metadata`，不依赖 Vue / NestJS / TypeORM / Element Plus |
| **`type` 字段是 UI 概念** | 保留在 `DictItem` 中，后端使用 `toDbItems()` 剥离，不做区分 |
| **字典 key 唯一性** | `DictMetaOptions.key` 作为唯一标识 + 数据库 `UNIQUE` 约束 |
| **自动注册** | `@DictMeta` 装饰器内调用 `registerDict()`，`getAllDicts()` 一次获取全部 |
| **业务层 vs 框架层** | 框架通用字典在 `packages/shared-dict/base/`；业务字典在根层级 `business-dict/`（private）；消费者自定义在 `src/dicts/` |
| **新增字典** | 在对应层新增一个 `@DictMeta` 类即可，装饰器自动注册到全局 Map，seeder 自动感知 |
| **注册表单例** | `moyan-shared-dict` 中的 `Map` 是模块级单例，所有 import 同一个包实例的消费者共享同一份注册表 |
| **`item_value` 类型** | 统一存储为 `VARCHAR(64)`，避免 tinyint/bigint/string 混用 |
| **uuid 生成** | seeder 使用 `uuid` 包；Entity 使用 TypeORM 的 `@PrimaryGeneratedColumn('uuid')` |
| **装饰器 target 一致性** | `@DictMeta`（ClassDecorator）和 `@DictEntry`（静态属性 PropertyDecorator）的 target 都是 constructor 本身，`toItems()` 直接从 `dictClass` 读取 metadata（不从 `prototype` 读取） |

---

## 11. 依赖清单

### 11.1 `packages/shared-dict/package.json`（框架层）

```json
{
  "name": "moyan-shared-dict",
  "version": "0.1.0",
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "types": "./dist/esm/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/esm/index.d.ts", "default": "./dist/esm/index.js" },
      "require": { "types": "./dist/cjs/index.d.ts", "default": "./dist/cjs/index.js" }
    }
  },
  "dependencies": {
    "reflect-metadata": "^0.2.2"
  },
  "devDependencies": {
    "typescript": "^5.x"
  }
}
```

> 双格式输出（ESM + CJS），前端 Vite 使用 `import` 条件获取 ESM，后端 Node.js 使用 `require` 条件获取 CJS。

### 11.2 `business-dict/package.json`（业务层，private）

```json
{
  "name": "business-dict",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "types": "./dist/esm/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/esm/index.d.ts", "default": "./dist/esm/index.js" },
      "require": { "types": "./dist/cjs/index.d.ts", "default": "./dist/cjs/index.js" }
    }
  },
  "dependencies": {
    "reflect-metadata": "^0.2.2",
    "moyan-shared-dict": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.x"
  }
}
```

### 11.3 消费者依赖声明

```json
// backend/package.json  & frontend/package.json
{
  "dependencies": {
    "moyan-shared-dict": "workspace:*",
    "business-dict": "workspace:*"
  }
}

// pnpm-workspace.yaml
packages:
  - "packages/*"
  - "backend"
  - "frontend"
  - "business-dict"       # ← 新增
```

### 11.4 Consumer 需要的配置

**TypeScript** (`tsconfig.json`):
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

**运行时入口** (前端 `main.ts` / 后端 `main.ts`):
```typescript
import 'reflect-metadata'
```

---

## 12. 风险与待定项

1. **`reflect-metadata` 兼容性**：需确认前端 Vite 构建和后端 NestJS 已配置该特性（通常 NestJS 已默认启用）
2. **字典 key 命名规范**：需统一约定 `key` 的命名风格（snake_case / camelCase / kebab-case），建议 `camelCase`
3. **`DictItem.type` 颜色体系**：当前绑定 Element Plus 的 tag type，若后续换 UI 库，需重新定义颜色映射
4. **`getAllDicts()` 与 `@DictMeta` 的执行顺序**：仅当所有字典类文件被 import 后（装饰器已执行），`getAllDicts()` 才能返回完整结果。需确保 seeder / 调用入口先 `import` 所有字典类
5. **npm 发布包名**：`moyan-shared-dict` 需确认在 npm registry 中未被占用
6. **workspace 协议兼容**：`pnpm-workspace.yaml` 中 `business-dict` 需正确配置，确保 IDE（VS Code）能识别 workspace 依赖

---

## 附录 A: 完整文件清单

| 文件 | 职责 |
|------|------|
| `packages/shared-dict/src/core/types.ts` | 类型定义 |
| `packages/shared-dict/src/core/decorator.ts` | `@DictMeta` / `@DictEntry` 装饰器 |
| `packages/shared-dict/src/core/helper.ts` | `toItems` / `getLabel` / `toDescription` / `toDbItems` / `getMeta` |
| `packages/shared-dict/src/core/registry.ts` | `registerDict` / `getAllDicts` |
| `packages/shared-dict/src/core/index.ts` | core 统一导出 |
| `packages/shared-dict/src/base/status.ts` | `StatusDict` / `BoolDict` |
| `packages/shared-dict/src/base/index.ts` | base 统一导出 |
| `packages/shared-dict/src/index.ts` | 顶层统一导出 |
| `packages/shared-dict/package.json` | 框架包配置（name: `moyan-shared-dict`） |
| `packages/shared-dict/tsconfig.json` | TS 配置 |
| `business-dict/src/user.ts` | `GenderDict` / `DeveloperDict` |
| `business-dict/src/supplier.ts` | `SupplierStatusDict`（示例） |
| `business-dict/src/index.ts` | barrel export |
| `business-dict/package.json` | 业务包配置（`"private": true`） |
| `business-dict/tsconfig.json` | TS 配置 |
| `packages/base-backend/src/database/seeds/dict.seeder.ts` | 字典数据入库 |
| `packages/base-backend/src/database/migrations/xxx-add-dict-tables.ts` | 字典表 DDL |
| `backend/src/main.ts` | 添加 `import 'business-dict'` 入口注入 |

## 附录 B: 外部消费者快速开始

```
# 安装框架包
npm install moyan-shared-dict reflect-metadata

# 创建业务字典
mkdir -p src/dicts
```

`src/dicts/order.ts`:
```typescript
import { DictMeta, DictEntry } from 'moyan-shared-dict'

@DictMeta({ key: 'order_status', label: '订单状态' })
export class OrderStatusDict {
  @DictEntry({ label: '待支付', type: 'warning' }) static PENDING = 0
  @DictEntry({ label: '已支付', type: 'success' }) static PAID    = 1
}
```

`src/main.ts` (Vue 前端):
```typescript
import 'reflect-metadata'
import 'moyan-shared-dict/base'   // ← 框架内置字典
import './dicts/order'            // ← 自定义业务字典
```

`src/main.ts` (NestJS 后端):
```typescript
import 'reflect-metadata'
import 'moyan-shared-dict/base'
import './dicts/order'

// getAllDicts() → StatusDict + BoolDict + OrderStatusDict
```

# 13 · 数据库种子

## 目录

- [`runSeeds`](#runseeds) — 执行种子数据
- [`seedDicts`](#seeddicts) — 字典数据种子
- [`syncAppTypesConfig`](#syncapptypesconfig) — 应用类型配置同步

---

## `runSeeds`

执行种子数据写入。

```typescript
import { runSeeds } from 'moyan-mfw-base/backend'

// 通常在数据库就绪钩子中调用
await runSeeds(dataSource, [
  { entity: MyEntity, data: [{ name: 'seed1' }, { name: 'seed2' }] },
])
```

> `createBaseBackendApp()` 的 `seeds` 选项也可以配置种子数据，无需手动调用。

---

## `seedDicts`

预置的字典数据种子。包含全部内置字典（状态、性别、权限类型、节点类型等）的数据库初始化数据。

```typescript
import { seedDicts } from 'moyan-mfw-base/backend'

// 手动触发字典数据初始化
await seedDicts(dataSource)
```

---

## `syncAppTypesConfig`

将 `createBaseBackendApp()` 的 `appTypes` 配置同步到数据库。

```typescript
import { syncAppTypesConfig } from 'moyan-mfw-base/backend'

const appTypes: AppTypeConfig[] = [
  { typeName: '电商后台', typeCode: 'ec_admin', multiAppEnabled: 1, builtinRole: [...] },
]

await syncAppTypesConfig(dataSource, appTypes)
```

> 设置 `syncAppTypes: true` 后，`createBaseBackendApp()` 在启动时自动调用此函数，通常无需手动调用。

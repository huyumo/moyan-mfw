# 共享字典体系

## 概述

前后端统一字典定义，通过 `@DictMeta` + `@DictEntry` 装饰器声明字典类，`toItems()` / `toDescription()` / `getLabel()` 提取数据，`MfwDictFormat` 组件统一渲染。

**核心原则**：字典定义只写一次，前端渲染、后端注释、数据库种子三处消费同一来源。

## 三层架构

```
packages/shared-dict/   ← 框架层（npm 发布，零业务依赖）
  src/base/             ← 框架内置字典：StatusDict, BoolDict, IsBuiltinDict...
  src/core/             ← 装饰器、注册表、工具函数

business-dict/          ← 业务层（项目私有，不进 npm）
  src/                  ← 业务字典：GenderDict, DeveloperDict, SupplierStatusDict...

src/dicts/              ← 消费层（开发者自定义，npm 用户扩展）
```

| 层级 | 位置 | 发布 | 示例 |
|------|------|------|------|
| 框架 | `packages/shared-dict/src/base/` | npm | `StatusDict`, `PermissionTypeDict` |
| 业务 | `business-dict/src/` | 私有 | `GenderDict`, `DeveloperDict` |
| 消费 | 项目 `src/dicts/` | 无 | 开发者自定义 |

## 定义字典

```typescript
import { DictMeta, DictEntry } from 'moyan-shared-dict'

@DictMeta({ key: 'gender', label: '性别', module: '用户管理' })
export class GenderDict {
  @DictEntry({ label: '未知', type: 'info'    })  static UNKNOWN = 0
  @DictEntry({ label: '男',   type: 'primary' })  static MALE    = 1
  @DictEntry({ label: '女',   type: 'danger'  })  static FEMALE  = 2
}
```

- `key`：字典唯一标识，对应数据库 `dict_key`
- `label`：字典中文名，用于 `toDescription()` 生成注释
- `module`：可选，所属业务模块
- `type`：ElTag 颜色类型，`MfwDictFormat as-tag` 模式使用

## 工具函数

| 函数 | 用途 | 返回 |
|------|------|------|
| `toItems(Dict)` | 提取 `DictItem[]` | `[{ value: 1, label: '启用', type: 'success' }]` |
| `getLabel(Dict, value)` | 获取显示文本 | `'启用'` |
| `toDescription(Dict)` | 生成 Entity comment | `'通用状态: 1=启用, 0=禁用'` |
| `toDbItems(Dict)` | 去除 type 字段，用于数据库写入 | `[{ value: 1, label: '启用' }]` |
| `getAllDicts()` | 获取全部已注册字典（Seeder 用） | `Array<{ key, label, module, items }>` |

## 后端使用

### Entity 字段注释

```typescript
import { toDescription, StatusDict } from 'moyan-shared-dict'

@Column({ type: 'tinyint', default: StatusDict.ENABLED, comment: toDescription(StatusDict) })
userStatus: number
```

### 字典种子数据

后端入口 `main.ts` 必须导入 `business-dict` 触发装饰器注册：

```typescript
import 'business-dict'
```

Seeder 调用 `getAllDicts()` 获取全部字典并写入 `sys_dict_types` + `sys_dict_items` 表。

## 前端使用

### MfwDictFormat 统一渲染

```vue
<template>
  <MfwDictFormat :value="row.status" :dict="toItems(StatusDict)" as-tag />
</template>

<script setup>
import { MfwDictFormat } from '../../../components'
import { toItems, StatusDict } from 'moyan-shared-dict'
</script>
```

渲染函数中：

```typescript
h(MfwDictFormat, { value: row.isBuiltin, dict: toItems(IsBuiltinDict), asTag: true })
```

### 禁止模式

```vue
<!-- ❌ 禁止：手动三元表达式 -->
<el-tag :type="row.status === 1 ? 'success' : 'danger'">
  {{ row.status === 1 ? '启用' : '禁用' }}
</el-tag>

<!-- ❌ 禁止：内联 STATUS 常量 -->
const STATUS = { ENABLED: 1, DISABLED: 0 } as const

<!-- ❌ 禁止：硬编码 options 数组 -->
elProps: {
  options: [
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 },
  ],
}

<!-- ✅ 正确：使用 MfwDictFormat -->
<MfwDictFormat :value="row.status" :dict="toItems(StatusDict)" as-tag />

<!-- ✅ 正确：使用 toItems() 获取 options -->
elProps: {
  options: toItems(StatusDict),
}
```

## 编译与构建

`moyan-shared-dict` 和 `business-dict` 采用双格式输出（ESM + CJS）：

```
dist/
  esm/    ← 前端 Vite 使用（import 条件）
  cjs/    ← 后端 Node.js 使用（require 条件）
```

**修改源码后必须执行**：

```bash
cd packages/shared-dict && pnpm run build
cd business-dict && pnpm run build
```

## 已踩过的坑

| 问题 | 原因 | 解决 |
|------|------|------|
| 前端 `does not provide an export named 'StatusDict'` | CJS 格式不支持 ESM named import | 双格式输出，`exports` 条件导出 |
| 后端 `Unexpected token 'export'` | `main` 指向 `.ts` 源码 | 编译为 CJS，`main` 指向 `dist/cjs/index.js` |
| `MfwDictFormat` 渲染 `--` | `@DictEntry` 存储在构造函数，`toItems` 读取 `prototype` | `Reflect.getOwnMetadata(ITEMS_KEY, dictClass)` 直接读构造函数 |
| `DictItem.type` 包含 `'primary'` 但 `CardPanelHeader.status.type` 不接受 | `ElTag` 支持的 type 比 `MfwCardPanel` 多 | 类型断言 `as 'success' \| 'warning' \| 'danger' \| 'info'` |

## 框架内置字典速查

| 字典类 | key | 值域 |
|--------|-----|------|
| `StatusDict` | `status` | 1=启用, 0=禁用 |
| `BoolDict` | `bool` | 1=是, 0=否 |
| `IsBuiltinDict` | `is_builtin` | 1=是, 0=否 |
| `IsOwnerDict` | `is_owner` | 1=是, 0=否 |
| `MultiAppEnabledDict` | `multi_app_enabled` | 1=支持, 0=不支持 |
| `PermissionTypeDict` | `permission_type` | PC=平台权限, NORMAL=普通权限 |
| `NodeTypeDict` | `node_type` | MENU=菜单, PAGE=页面, TAG=标签 |
| `ShowModeDict` | `show_mode` | NORMAL=正常, DEV=开发者模式 |
| `IsAutoSyncDict` | `is_auto_sync` | 1=是, 0=否 |
| `IsVisibleDict` | `is_visible` | 1=是, 0=否 |
| `IsCacheDict` | `is_cache` | 1=是, 0=否 |
| `AuditModuleDict` | `audit_module` | AUTH/USER/ROLE/PERMISSION/APP/APP_TYPE/MEMBER/SYSTEM/UPLOAD |

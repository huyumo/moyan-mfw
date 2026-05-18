# moyan-mfw-base/shared API 参考手册

## 概览

`moyan-mfw-base/shared` 是 MFW 框架的**共享字典（Dict）框架**，用于定义前后端共享的枚举常量（状态、类型、布尔等），通过装饰器 + 反射元数据实现声明式字典定义。

## 导入方式

```typescript
import { StatusDict, getLabel, toItems, getAllDicts } from 'moyan-mfw-base/shared'
```

## 文档导航

| 文档 | 内容 |
|------|------|
| [01-dict-framework.md](./01-dict-framework.md) | 字典框架核心 API：`@DictMeta` / `@DictEntry` / `registerDict` / `getAllDicts` / `toItems` / `getLabel` / `getMeta` / `toDescription` / `toDbItems` |
| [02-builtin-dicts.md](./02-builtin-dicts.md) | 14 个内置字典类：StatusDict / BoolDict / GenderDict / PermissionTypeDict / NodeTypeDict / ... |

## 架构分层

```
┌─────────────────────────────────────┐
│         业务字典（自定义）             │
│  @DictMeta / @DictEntry + 静态属性    │
├─────────────────────────────────────┤
│     内置字典 (base/)                  │
│  StatusDict / GenderDict / ...       │
├─────────────────────────────────────┤
│     核心运行时 (core/)                │
│  helper.ts  → toItems / getLabel / … │
│  registry.ts → registerDict / getAll  │
│  decorator.ts → @DictMeta / @DictEntry│
│  types.ts    → DictItem / DictMetaOpts│
└─────────────────────────────────────┘
```

## 快速示例

```typescript
import { StatusDict, getLabel, toItems } from 'moyan-mfw-base/shared'

// 查标签
getLabel(StatusDict, 1)       // → '启用'

// 转选项（Element Plus el-select / el-radio 等）
toItems(StatusDict)
// → [{ value: 1, label: '启用', type: 'success' }, { value: 0, label: '禁用', type: 'info' }]

// 获取所有已注册字典（供后端接口使用）
import { getAllDicts } from 'moyan-mfw-base/shared'
const allDicts = getAllDicts()
// → [{ key: 'status', label: '通用状态', items: [...] }, ...]
```

# 05 · 字典定义与使用指南

## 核心原则

**字典定义只写一次**，前端渲染、后端注释、数据库种子三处消费同一来源。

---

## 架构分层

| 层级 | 位置 | 示例 |
|------|------|------|
| 框架内置 | `moyan-mfw-base/shared` | `StatusDict`、`GenderDict`、`AuditModuleDict` |
| 业务层 | 业务项目 `src/shared/dicts/` | `OrderStatusDict`、`SupplierTypeDict` |

---

## 定义字典

```typescript
import { DictMeta, DictEntry } from 'moyan-mfw-base/shared'

@DictMeta({ key: 'order_status', label: '订单状态', module: 'order' })
export class OrderStatusDict {
  @DictEntry({ label: '待支付', type: 'warning' })  static PENDING   = 'PENDING'
  @DictEntry({ label: '已支付', type: 'success' })  static PAID      = 'PAID'
  @DictEntry({ label: '已发货', type: 'primary' })  static SHIPPED   = 'SHIPPED'
  @DictEntry({ label: '已完成', type: 'info' })     static COMPLETED = 'COMPLETED'
  @DictEntry({ label: '已取消', type: 'danger' })   static CANCELED  = 'CANCELED'
}
```

| 参数 | 说明 |
|------|------|
| `key` | 字典唯一标识，对应数据库 `dict_key` |
| `label` | 字典中文名 |
| `module` | 可选，所属业务模块 |
| `type` | Element Plus Tag 颜色：`primary` / `success` / `warning` / `danger` / `info` |

---

## 工具函数速查

| 函数 | 用途 | 返回 |
|------|------|------|
| `toItems(Dict)` | 提取 `DictItem[]` | `[{ value: 1, label: '启用', type: 'success' }]` |
| `getLabel(Dict, value)` | 获取标签文本 | `'启用'` |
| `getMeta(Dict)` | 获取元配置 | `{ key, label, module? }` |
| `toDescription(Dict)` | 生成描述字符串 | `'通用状态: 1=启用, 0=禁用'` |
| `toDbItems(Dict)` | 去除 type 字段 | `[{ value: 1, label: '启用' }]` |
| `getAllDicts()` | 获取全部已注册字典 | `Array<{ key, label, module, items }>` |

---

## 后端使用

### Entity 字段注释

```typescript
import { toDescription, StatusDict } from 'moyan-mfw-base/shared'

@Column({ type: 'tinyint', default: StatusDict.ENABLED, comment: toDescription(StatusDict) })
userStatus: number
// → 列注释：'通用状态: 1=启用, 0=禁用'
```

### 字典种子数据

Seeder 调用 `getAllDicts()` 获取全部字典并写入 `sys_dict_types` + `sys_dict_items` 表。

---

## 前端使用

### 表格列渲染

```typescript
// 渲染函数中
h(MfwDictFormat, { value: row.status, dict: toItems(StatusDict), asTag: true })
```

### 模板中使用

```vue
<MfwDictFormat :value="row.status" :dict="toItems(StatusDict)" as-tag />
```

### 表单下拉选项

```typescript
const formTemplate = [
  {
    key: 'status', label: '状态', component: 'el-select',
    elProps: { options: toItems(StatusDict) },
  },
]
```

---

## 禁止模式

```typescript
// ✋ 禁止：手动三元表达式
<el-tag :type="row.status === 1 ? 'success' : 'danger'">
  {{ row.status === 1 ? '启用' : '禁用' }}
</el-tag>

// ✋ 禁止：内联 STATUS 常量
const STATUS = { ENABLED: 1, DISABLED: 0 } as const

// ✋ 禁止：硬编码 options 数组
elProps: { options: [{ label: '启用', value: 1 }, { label: '禁用', value: 0 }] }

// ✅ 正确：使用 MfwDictFormat
<MfwDictFormat :value="row.status" :dict="toItems(StatusDict)" as-tag />

// ✅ 正确：使用 toItems() 获取 options
elProps: { options: toItems(StatusDict) }
```

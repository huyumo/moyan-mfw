# 01 · 字典框架核心 API

MFW 字典框架通过类装饰器 + 反射元数据实现声明式枚举定义，所有导出均从 `moyan-mfw-base/shared` 导入。

---

## 核心类型

### `DictItem`

```typescript
interface DictItem {
  value: string | number          // 枚举值
  label: string                   // 显示文本
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'  // Element Plus Tag 类型
}
```

### `DictMetaOptions`

```typescript
interface DictMetaOptions {
  key: string        // 唯一标识，如 'status'、'gender'
  label: string      // 中文名称，如 '通用状态'、'性别'
  module?: string    // 所属模块，用于分组
}
```

### 元数据键

```typescript
const META_KEY  = Symbol('dict:meta')   // 存储 DictMetaOptions
const ITEMS_KEY = Symbol('dict:items')  // 存储 DictEntry 条目
```

---

## 装饰器

### `@DictMeta(options)`

类装饰器，标注字典元信息并自动调用 `registerDict()` 注册。

```typescript
import { DictMeta, DictEntry } from 'moyan-mfw-base/shared'

@DictMeta({ key: 'order_status', label: '订单状态' })
export class OrderStatusDict {
  @DictEntry({ label: '待支付' }) static PENDING  = 'PENDING'
  @DictEntry({ label: '已支付' }) static PAID     = 'PAID'
  @DictEntry({ label: '已取消' }) static CANCELED = 'CANCELED'
}
```

### `@DictEntry(item)`

属性装饰器，标注静态属性的字典条目。`value` 取自运行时的属性值，无需手动指定。

```typescript
@DictEntry({ label: '启用', type: 'success' })
static ENABLED = 1
// → 生成 DictItem: { value: 1, label: '启用', type: 'success' }
```

---

## 运行时查询

### `toItems(dictClass)`

将字典类转为 `DictItem[]`，可直接用于 `<el-select>`、`<el-radio-group>` 等组件的 `options`。

```typescript
import { StatusDict, toItems } from 'moyan-mfw-base/shared'

toItems(StatusDict)
// → [{ value: 1, label: '启用', type: 'success' }, { value: 0, label: '禁用', type: 'info' }]
```

### `getLabel(dictClass, value)`

根据值查找对应的标签文本。找不到返回 `'--'`。

```typescript
import { StatusDict, getLabel } from 'moyan-mfw-base/shared'

getLabel(StatusDict, 1)     // → '启用'
getLabel(StatusDict, 999)   // → '--'
```

### `getMeta(dictClass)`

读取字典类的元配置。

```typescript
import { StatusDict, getMeta } from 'moyan-mfw-base/shared'

getMeta(StatusDict)  // → { key: 'status', label: '通用状态' }
```

### `toDescription(dictClass)`

生成描述字符串，格式 `标签: 值1=名称1, 值2=名称2`。

```typescript
import { StatusDict, toDescription } from 'moyan-mfw-base/shared'

toDescription(StatusDict)
// → '通用状态: 1=启用, 0=禁用'
```

### `toDbItems(dictClass)`

返回不含 `type` 的 `{ value, label }[]`，适合写入数据库。

```typescript
import { StatusDict, toDbItems } from 'moyan-mfw-base/shared'

toDbItems(StatusDict)
// → [{ value: 1, label: '启用' }, { value: 0, label: '禁用' }]
```

---

## 注册表

### `registerDict(dictClass)`

手动将字典类注册到全局注册表。`@DictMeta()` 会自动调用，通常无需手动使用。

### `getAllDicts()`

获取所有已注册字典的结构化数据，包含 `key`、`label`、`module`、`items`。

```typescript
import { getAllDicts } from 'moyan-mfw-base/shared'

const all = getAllDicts()
// → [{ key: 'status', label: '通用状态', items: [...] }, ...]
```

用于后端 `/api/dict/list` 类接口，将全部字典一次性返回前端。

---

## 自定义字典完整示例

```typescript
// src/shared/dicts/order-status.dict.ts
import { DictMeta, DictEntry } from 'moyan-mfw-base/shared'

@DictMeta({ key: 'order_status', label: '订单状态', module: 'order' })
export class OrderStatusDict {
  @DictEntry({ label: '待支付', type: 'warning' })
  static PENDING: string = 'PENDING'

  @DictEntry({ label: '已支付', type: 'success' })
  static PAID: string = 'PAID'

  @DictEntry({ label: '已发货', type: 'primary' })
  static SHIPPED: string = 'SHIPPED'

  @DictEntry({ label: '已完成', type: 'info' })
  static COMPLETED: string = 'COMPLETED'

  @DictEntry({ label: '已取消', type: 'danger' })
  static CANCELED: string = 'CANCELED'
}
```

使用：

```typescript
import { OrderStatusDict, getLabel, toItems } from './order-status.dict'

// 表格列格式化
<template>
  <el-tag :type="statusItem.type">{{ statusItem.label }}</el-tag>
</template>

const statusItem = toItems(OrderStatusDict).find(i => i.value === row.status)

// 表单下拉选项
<el-select>
  <el-option
    v-for="item in toItems(OrderStatusDict)"
    :key="item.value"
    :label="item.label"
    :value="item.value"
  />
</el-select>
```

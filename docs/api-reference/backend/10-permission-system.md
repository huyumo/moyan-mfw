# 10 · 权限系统

MFW 基于 BigInt 位运算实现权限控制。权限名称按注册顺序对应从低位到高位的位值。

```typescript
import {
  DEFAULT_PERMISSION_VALUES,   // 基础权限：['添加','编辑','删除','导出','导入']
  EXTENSION_PERMISSION_VALUES, // 扩展权限：['审批','拒绝','发布','归档']
  PERMISSION_VALUES,           // 合并后的全部权限值
  registerPermissionValues,    // 注册业务层权限
  getPermissionValues,         // 获取当前全部权限值
  buildPerValue,               // 权限名称 → bigint 位值
  getPermValue,                // 单个权限名称 → bigint
  parsePerValue,               // bigint → 权限名称数组
  hasPermission,               // 检查是否包含某权限
  getPermissionOptions,        // 获取权限选项（UI 展示用）
  initPermissionValueCache,    // 初始化权限值缓存
  getPermissionValueCache,     // 获取权限缓存
} from 'moyan-mfw-base/backend'
```

---

## 权限常量

| 常量 | 值 | 说明 |
|------|-----|------|
| `DEFAULT_PERMISSION_VALUES` | `['添加', '编辑', '删除', '导出', '导入']` | 基础框架提供，不可覆盖 |
| `EXTENSION_PERMISSION_VALUES` | `['审批', '拒绝', '发布', '归档']` | 框架扩展权限 |
| `PERMISSION_VALUES` | `getPermissionValues()` | 合并后的全部权限值（含业务注册） |

---

## 业务层注册权限

```typescript
import { registerPermissionValues } from 'moyan-mfw-base/backend'

registerPermissionValues(['上架', '发货', '退款'])
// 现在 PERMISSION_VALUES = ['添加','编辑','删除','导出','导入','审批','拒绝','发布','归档','上架','发货','退款']
```

> 推荐在 `createBaseBackendApp()` 的 `permissionValues` 选项中直接配置。

---

## `buildPerValue(names)`

将权限名称数组转为位运算 bigint 值。

```typescript
buildPerValue(['添加'])            // 1n
buildPerValue(['添加', '编辑'])     // 3n  (1n | 2n)
buildPerValue(['添加', '编辑', '删除']) // 7n  (1n | 2n | 4n)
```

---

## `getPermValue(name)`

获取单个权限名称对应的位值。

```typescript
getPermValue('添加') // 1n
getPermValue('编辑') // 2n
```

---

## `parsePerValue(value)`

将位运算值字符串解析为权限名称数组。

```typescript
parsePerValue('3')   // ['添加', '编辑']
parsePerValue('10')  // ['删除', '导出']   (4n | 8n = 12n → 索引 2,3)
```

---

## `hasPermission(value, name)`

检查位运算值中是否包含指定权限。

```typescript
hasPermission('3', '添加')  // true  (3n & 1n !== 0n)
hasPermission('3', '删除')  // false (3n & 4n === 0n)
```

---

## `getPermissionOptions(parentPermissionValue?)`

获取所有权限选项（用于 UI 权限选择器）。

```typescript
getPermissionOptions()
// [{ name: '添加', label: '添加', value: 1 }, ...]

// 传入父权限值可过滤子权限选项
getPermissionOptions(7)  // 只返回父级已拥有的权限子集
```

---

## 类型导出

```typescript
import type {
  DefaultPermissionName,    // '添加' | '编辑' | '删除' | '导出' | '导入'
  ExtensionPermissionName,  // '审批' | '拒绝' | '发布' | '归档'
  BasePermissionName,       // DefaultPermissionName | ExtensionPermissionName
} from 'moyan-mfw-base/backend'
```

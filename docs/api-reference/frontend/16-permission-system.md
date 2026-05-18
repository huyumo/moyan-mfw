# 16 · 前端权限系统

MFW 基于 BigInt 位运算实现权限控制。前端权限体系与后端完全对称。

---

## 导入

```typescript
import {
  DEFAULT_PERMISSION_VALUES,      // ['添加','编辑','删除','导出','导入']
  EXTENSION_PERMISSION_VALUES,    // ['审批','拒绝','发布','归档']
  PERMISSION_VALUES,               // 合并后的全部权限值
  registerPermissionValues,        // 注册业务层权限
  setPermissionConfig,             // 设置全局权限配置
  getPermissionConfig,             // 获取全局权限配置
  createPermissionConfig,          // 创建权限配置
  buildPerValue,                   // 权限名称 → bigint 位值
  getPermValue,                    // 单个权限名称 → bigint
  parsePerValue,                   // bigint → 权限名称数组
  hasPermission,                   // 检查是否包含某权限
  getPermissionOptions,            // 获取权限选项（UI 用）
  createBusinessPageConfigFn,      // 创建业务层页面配置函数
  initPermissionCache,             // 初始化权限值缓存
  getPermissionValueCache,         // 获取缓存
} from 'moyan-mfw-base/frontend'
```

### 类型

```typescript
import type {
  PermissionName,            // DefaultPermissionName | ExtensionPermissionName
  DefaultPermissionName,     // '添加' | '编辑' | '删除' | '导出' | '导入'
  ExtensionPermissionName,   // '审批' | '拒绝' | '发布' | '归档'
} from 'moyan-mfw-base/frontend'
```

---

## `createBusinessPageConfigFn(businessPermissions)`

业务层创建带类型推断的 `definePageConfig` 函数。自动注册业务权限并返回配置工厂。

```typescript
import { createBusinessPageConfigFn } from 'moyan-mfw-base/frontend'

// business/src/permissions.ts
export const BUSINESS_PERMISSION_VALUES = ['发货', '充值', '接待', '指派'] as const
export const defineBusinessPageConfig =
  createBusinessPageConfigFn(BUSINESS_PERMISSION_VALUES)

// business/src/views/order/index.ts
import { defineBusinessPageConfig } from '../permissions'

export default defineBusinessPageConfig({
  page: OrderList,
  path: 'order',
  name: '订单管理',
  permissions: ['发货', '充值', '添加'],  // 完整类型推断
})
```

---

## `buildPerValue(names)`

```typescript
buildPerValue(['添加'])            // 1n
buildPerValue(['添加', '编辑'])     // 3n
```

---

## `parsePerValue(value)`

```typescript
parsePerValue('3')   // ['添加', '编辑']
parsePerValue('10')  // ['删除', '导出']
```

---

## `initPermissionCache(values)`

从后端获取权限值映射后初始化缓存。

```typescript
const { fetchPermissionValues, initPermissionCache } = createBaseAdminApp()

const values = await fetchPermissionValues()
initPermissionCache(values)
// 缓存后 buildPerValue / parsePerValue 等才能正确工作
```

> `fetchPermissionValues()` 调用 `/api/permission-values/get-permission-values` 接口。

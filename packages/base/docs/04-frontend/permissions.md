# 前端 · 权限

## 1. 注册业务权限值

业务自定义权限名称（如「发货」「充值」）必须与后端一致注册：

```typescript
// main.ts
import { registerPermissionValues } from 'moyan-mfw-base/frontend';

registerPermissionValues(['发货', '充值', '接待', '指派']);
```

### 页面配置工厂 `createBusinessPageConfigFn`（带类型推断）

```typescript
// src/permissions.ts
import { createBusinessPageConfigFn } from 'moyan-mfw-base/frontend';
import { BUSINESS_PERMISSION_VALUES } from 'moyan-mfw-shared';

export const defineBusinessPageConfig = createBusinessPageConfigFn(BUSINESS_PERMISSION_VALUES);
```

## 2. 初始化权限值缓存

```typescript
const values = await admin.fetchPermissionValues(); // 从后端拉取 name → bitValue
admin.initPermissionCache(values);                  // 初始化缓存（v-permission 依赖）
```

## 3. 页面级权限

在 menuTrees 的页面节点声明 `permissions`，路由守卫自动校验（不满足跳 `/403`）：

```typescript
{ path: 'orders', name: '订单中心', permissions: ['发货', '充值', '添加'], component: OrdersPage }
```

## 4. 按钮级权限：`v-permission` 指令

```vue
<!-- 方式一：权限编码（在权限菜单中匹配 permCode） -->
<el-button v-permission="'sys:user:create'">新增</el-button>

<!-- 方式二：权限值列表（自动从当前路由推断 permCode） -->
<el-button v-permission="{ value: ['添加'] }">新增</el-button>

<!-- 方式三：显式指定 permCode + 权限值 -->
<el-button v-permission="{ permCode: 'supplier:manage', value: ['发货', '退款'] }">发货</el-button>
```

无权限时元素 `display: none`。

## 5. 组合式函数 `usePermission()`

```typescript
import { usePermission } from 'moyan-mfw-base/frontend';

const { hasPermissionValue, hasAnyPermissionValue, hasAllPermissionValues, getCurrentPermCode } = usePermission();

const canShip = hasPermissionValue({ value: ['发货'] });
const canOperate = hasAnyPermissionValue(['发货', '退款']);
const canDoAll = hasAllPermissionValues(['添加', '编辑']);
const code = getCurrentPermCode();
```

## 6. 开发者模式

- `isDeveloper: 1` 用户绕过全部权限校验。
- `showMode: 'DEV'` 的菜单/页面仅开发者可见可访问。
- `useAuthStore().enableDevMode()` 可弹出开发者密码验证并开启开发者模式（sessionStorage 记忆）。

## 7. 权限值工具

```typescript
import { buildPerValue, getPermValue, parsePerValue, hasPermission } from 'moyan-mfw-base/frontend';

buildPerValue(['添加', '编辑']);  // 3n
parsePerValue('3');              // ['添加', '编辑']
hasPermission('3', '添加');      // true
```

## 常见问题

1. `v-permission` 不生效：检查是否执行了 `fetchPermissionValues` + `initPermissionCache`。
2. 权限名找不到：前后端注册的权限名称不一致。
3. 页面 403：菜单树未同步到后端（用 RouteSyncButton 同步）或权限未分配给角色。

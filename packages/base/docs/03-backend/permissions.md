# 后端 · 权限体系

## 权限值（PermissionValue）

权限值是一组「权限名称 → BigInt 位」的映射，名称与位序全局唯一，由后端统一分配并写入 `sys_permission_values` 表。

### 内置权限值

| 分组 | 权限名称 |
|------|----------|
| 默认 `DEFAULT_PERMISSION_VALUES` | 添加 / 编辑 / 删除 / 导出 / 导入 |
| 扩展 `EXTENSION_PERMISSION_VALUES` | 审批 / 拒绝 / 发布 / 归档 |

### 注册业务权限值

```typescript
// 方式一：应用工厂
createBaseBackendApp({ permissionValues: ['上架', '发货', '退款', '对账'] })

// 方式二：直接注册（需在控制器使用前执行）
import { registerPermissionValues } from 'moyan-mfw-base/backend';
registerPermissionValues(['上架', '发货', '退款']);

// 方式三：业务装饰器工厂（推荐，自动注册 + 类型推断）
export const Permission = createBusinessPermissionDecorator(['上架', '发货'] as const);
```

> 前端必须注册同一组权限名称（`registerPermissionValues`），否则 `buildPerValue` 会因找不到位值而抛错。

## 位运算工具函数

```typescript
import {
  buildPerValue,    // ['添加','编辑'] → 3n
  getPermValue,     // '添加' → 1n
  parsePerValue,    // '3' → ['添加','编辑']
  hasPermission,    // ('3', '添加') → true
  getPermissionOptions, // 权限选项（UI 用）
} from 'moyan-mfw-base/backend';
```

## 权限点与菜单

权限点（`sys_permissions`）是树形结构：`MENU` 分组 → `PAGE` 页面 → `TAG` 标签。每个节点含 `permCode`、`routePath`、`iconName`、`showMode`（`NORMAL`/`DEV`）、`isVisible` 与权限值。

### 权限来源：RouteSync（菜单树同步）

前端 `menu-trees.ts` 是权限数据的唯一来源：

```
前端菜单树（含 roleCode / permissions / permCode）
  → RouteSyncButton（仅开发者可见）
  → POST /api/route-sync/check（哈希比对）
  → POST /api/route-sync/sync（执行同步）
      ├─ 同步 PC 权限到 sys_permissions
      ├─ 同步 AppType 权限池到 sys_app_type_permissions
      ├─ 同步内置角色权限到 sys_role_permissions
      └─ 清理不在新配置中的 isAutoSync=1 权限
```## 权限校验

### 接口级（PermissionGuard）

```typescript
@Permission('supplier:manage', ['上架'])          // 需要「上架」权限位
@Permission('supplier:manage')                    // 只要拥有该权限点即可
@SkipPermission()                                  // 跳过权限校验
```

### 权限池（AppType 权限池）

每个 AppType 有独立权限池（`sys_app_type_permissions`），限制了该应用类型下角色可分配的最大权限范围；角色权限是权限池的子集。

### 开发者

`isDeveloper: 1` 的用户绕过所有权限校验（前后端均生效），并可看到 `showMode: 'DEV'` 的菜单/页面。

## 常见问题

- **403 但已登录**：多为权限点未同步（菜单树未推送）或当前应用类型与路由不匹配。
- **新增权限名称后接口报「未知的权限名称」**：前后端注册的权限值不一致，或未重新同步 `sys_permission_values`。
- **`buildPerValue` 抛错**：`initPermissionCache` 未执行（前端）或权限值缓存为空。

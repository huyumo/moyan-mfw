# 组件 · 业务（business）

业务类组件服务于框架管理能力（应用/角色/权限/成员），多数用于内置系统页面，业务方可按需复用。

## `RouteSyncButton` — 权限同步按钮

将前端菜单树推送到后端完成权限同步，**仅开发者可见**：

```typescript
import { RouteSyncButton } from 'moyan-mfw-base/frontend';

createBaseAdminApp({
  menuTrees,
  layoutExtensions: { sidebarFooter: RouteSyncButton },
});
```

点击后依次调用 `/api/route-sync/check`（哈希比对）与 `/api/route-sync/sync`（执行同步）。

## `AppSelectorDialog` — 应用选择弹窗

登录后多应用选择的默认弹窗（内置登录页已集成）。也可手动弹出：

```typescript
import { MfwPopup, AppSelectorDialog } from 'moyan-mfw-base/frontend';

MfwPopup.open({
  title: '选择应用',
  component: AppSelectorDialog,
  popupProps: { width: '600px', closeOnClickModal: false },
  footer: false,
});
```

## `MfwPermissionTree` — 权限树

树形权限点展示/选择：

```vue
<MfwPermissionTree :data="treeData" v-model:checked-keys="checkedKeys" show-checkbox />
```

## `RolePermissionPanel` — 角色权限面板

角色权限分配面板（树 + 权限位勾选），内置角色管理页使用。

## `PermissionManager` — 权限管理器

权限点（MENU/PAGE/TAG）树形管理组件，内置权限管理页使用；内含 `PermissionNodeForm` 节点编辑表单。

## `PermissionPoolPanel` / `MfwPermissionValuePanel`

应用类型权限池管理面板 / 权限值（位）配置面板，内置应用类型管理页使用。

## `RoleCard` / `RoleForm` / `BuiltinRoleDialog`

角色卡片展示 / 角色编辑表单 / 内置角色分配弹窗，内置角色管理页使用。

## `OwnerChanger` — 拥有者变更

应用拥有者变更弹窗内容组件：

```vue
<OwnerChanger :app-id="row.id" @changed="onOwnerChanged" />
```

## `CustomMenuEditor` — 自定义菜单编辑器

应用类型自定义菜单编辑，内置应用类型管理页使用。## `NoAppsEmpty` — 无应用空态

用户没有任何应用时的空态面板：

```vue
<NoAppsEmpty />
```

## 布局类辅助组件

| 组件 | 说明 |
|------|------|
| `ProfilePanel` | 个人资料面板（头像/基本信息） |
| `PasswordChangeForm` | 修改密码表单（可嵌入弹窗） |

## 使用规范

1. 业务方通常不需要直接使用权限管理类组件（内置页面已集成）；需要时优先复用而非重写。
2. 权限相关组件要求当前用户权限数据已加载（`authStore.permissionMenu` 非空）。
3. `RouteSyncButton` 只建议挂在 `sidebarFooter`，不要用于业务页面（仅开发者可见）。

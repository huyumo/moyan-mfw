---
version: "1.0"
last_updated: "2026-05-09"
scope: auth
triggers:
  - 多租户
  - 应用类型
  - 应用实例
  - 成员管理
  - 权限池
dependencies: []
maturity: stable
tags: [多租户, 应用类型, 应用实例, 成员管理, 权限池, 角色]
---

# 多租户与多应用机制

## 三层模型

```
应用类型(AppType) ──1:N──→ 应用实例(App) ──1:N──→ 应用成员(AppMember)
     │                                              │
     └── 权限池(AppTypePermission)                    └── 角色(Role)
```

## 创建新应用类型（多商家模型）

场景：系统需要支持"电商商家"和"物流商家"两种类型

### 1. 创建应用类型

`POST /api/app-types`

```typescript
{
  "typeName": "电商商家",
  "typeCode": "ecommerce",
  "typeDesc": "电商平台商家",
  "icon": "Shop",
  "multiAppEnabled": 1   // 允许创建多个应用实例
}
```

### 2. 配置权限池

`PUT /api/app-types/{appTypeId}/permission-pool`

```typescript
{
  "permissions": [
    { "permissionId": "xxx", "permissionValue": "7" },  // 添加|编辑|删除
  ]
}
```

### 3. 创建角色

`POST /api/roles`，绑定 `appTypeId`

```typescript
{
  "roleName": "商家管理员",
  "roleCode": "merchant_admin",
  "appTypeId": "电商商家类型ID"
}
```

## 创建新应用实例（多应用模型）

场景：为某个商家创建一个应用实例

### 1. 创建应用

`POST /api/apps`

```typescript
{
  "appName": "XX旗舰店",
  "appCode": "xx-flagship",
  "appTypeId": "电商商家类型ID",
  "ownerId": "商家管理员用户ID"
}
```

### 2. 添加成员

`POST /api/apps/{appId}/members`

### 3. 分配角色

`PUT /api/apps/{appId}/members/{userId}/roles`

## 角色作用域规则

| 角色属性 | 作用域 | 说明 |
|---------|--------|------|
| 无 appId、无 appTypeId | 全局 | 所有应用可见 |
| 有 appTypeId | 应用类型级 | 该类型下所有应用可见 |
| 有 appId | 应用实例级 | 仅该应用可见 |

## 权限池约束

角色的权限分配只能从其所属应用类型的**权限池**中选择。权限池定义了该类型的应用可用的权限范围。

## 反模式（Red Flags）— 立即停止

- ✋ 角色不绑定 `appTypeId` 也不绑定 `appId` → 创建了全局角色，确认是否有意为之
- ✋ 权限池未配置就分配角色权限 → 角色权限不能超出权限池范围
- ✋ 应用实例不设置 `ownerId` → 拥有者是应用管理员，必须指定
- ✋ 直接操作 `sys_user_roles` 表绕过 API → 使用角色管理接口确保数据一致性

## multiAppEnabled 语义

`multiAppEnabled` 是**用户维度**约束，不是全局实例数限制：

| 值 | 语义 | 约束点 |
|----|------|--------|
| 1 | 支持多应用 — 用户可成为同类型多个实例的成员 | 无限制 |
| 0 | 不支持多应用 — 用户只能成为同类型一个实例的成员 | `AppMemberService.addMember()` |

`AppService.create()` **不**检查 `multiAppEnabled`，因为不同用户可以各自创建一个同类型应用实例。

## 变更负责人 (changeOwner)

`AppService.changeOwner()` 完整交接规则：

1. 删旧 owner 的 `sys_user_roles`（本应用范围）
2. 删旧 owner 的 `sys_app_members`（彻底移除与应用的关联）
3. 改 `app.ownerId`
4. `INSERT IGNORE` 新 owner 到 `sys_app_members`
5. 查 `sys_roles WHERE isOwner=1 AND (appId=? OR appTypeId=?)`，将拥有者角色 `INSERT IGNORE` 给新 owner

全部包在一个 `dataSource.transaction()` 中，任一步骤失败则回滚。

## PermissionGuard 成员关系校验

`PermissionGuard` 仅通过 `sys_user_roles WHERE userId AND appId` 查询角色，**不会**验证 `sys_app_members` 中是否存在该用户的成员记录。如果用户角色残留但成员关系已被移除，仍可通过权限校验。

## 应用类型同步

`syncBuiltinRoles` / `createBuiltinRoles` 使用配置中的 `isOwner` 字段（`roleConfig.isOwner ?? 0`），按 `roleCode` 查 DB：

- 已存在 → 跳过（不更新任何字段）
- 不存在 → `INSERT` 新角色

`AppTypeConfig.builtinRole` 中必须有且仅有一个 `isOwner: 1` 的角色，`validateOwnerRole()` 在启动时强制执行此约束。

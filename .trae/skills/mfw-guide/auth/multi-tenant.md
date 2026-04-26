---
version: "1.0"
last_updated: "2026-04-25"
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

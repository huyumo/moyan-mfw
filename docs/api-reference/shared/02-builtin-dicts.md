# 02 · 内置字典类

MFW 预置 14 个字典类，覆盖状态、角色、应用、权限、审计、用户六大领域。全部从 `moyan-mfw-base/shared` 导入。

---

## 通用状态

### `StatusDict` · key: `'status'`

```typescript
import { StatusDict } from 'moyan-mfw-base/shared'
```

| 值 | 标签 | Type |
|----|------|------|
| `ENABLED = 1` | 启用 | `success` |
| `DISABLED = 0` | 禁用 | `info` |

### `BoolDict` · key: `'bool'`

```typescript
import { BoolDict } from 'moyan-mfw-base/shared'
```

| 值 | 标签 | Type |
|----|------|------|
| `YES = 1` | 是 | `success` |
| `NO = 0` | 否 | `info` |

---

## 用户相关

### `GenderDict` · key: `'gender'`

```typescript
import { GenderDict } from 'moyan-mfw-base/shared'
```

| 值 | 标签 | Type |
|----|------|------|
| `UNKNOWN = 0` | 未知 | `info` |
| `MALE = 1` | 男 | `primary` |
| `FEMALE = 2` | 女 | `danger` |

### `DeveloperDict` · key: `'developer'`

| 值 | 标签 | Type |
|----|------|------|
| `YES = 1` | 是 | `success` |
| `NO = 0` | 否 | `info` |

---

## 角色相关

### `IsBuiltinDict` · key: `'is_builtin'`

| 值 | 标签 | Type |
|----|------|------|
| `YES = 1` | 内置 | `success` |
| `NO = 0` | 非内置 | `info` |

### `IsOwnerDict` · key: `'is_owner'`

| 值 | 标签 | Type |
|----|------|------|
| `YES = 1` | 拥有者 | `success` |
| `NO = 0` | 非拥有者 | `info` |

---

## 应用相关

### `MultiAppEnabledDict` · key: `'multi_app_enabled'`

| 值 | 标签 | Type |
|----|------|------|
| `YES = 1` | 支持 | `success` |
| `NO = 0` | 不支持 | `info` |

---

## 权限相关

### `PermissionTypeDict` · key: `'permission_type'`

| 值 | 标签 | Type |
|----|------|------|
| `PC = 'PC'` | 平台权限 | `primary` |
| `NORMAL = 'NORMAL'` | 普通权限 | `success` |

### `NodeTypeDict` · key: `'node_type'`

| 值 | 标签 | Type |
|----|------|------|
| `MENU = 'MENU'` | 菜单 | `primary` |
| `PAGE = 'PAGE'` | 页面 | `success` |
| `TAG = 'TAG'` | 标签 | `warning` |

### `ShowModeDict` · key: `'show_mode'`

| 值 | 标签 | Type |
|----|------|------|
| `NORMAL = 'NORMAL'` | 正常 | `success` |
| `DEV = 'DEV'` | 开发者模式 | `warning` |

### `IsAutoSyncDict` · key: `'is_auto_sync'`

| 值 | 标签 | Type |
|----|------|------|
| `YES = 1` | 是 | `success` |
| `NO = 0` | 否 | `info` |

### `IsVisibleDict` · key: `'is_visible'`

| 值 | 标签 | Type |
|----|------|------|
| `YES = 1` | 是 | `success` |
| `NO = 0` | 否 | `info` |

### `IsCacheDict` · key: `'is_cache'`

| 值 | 标签 | Type |
|----|------|------|
| `YES = 1` | 是 | `success` |
| `NO = 0` | 否 | `info` |

---

## 审计相关

### `AuditModuleDict` · key: `'audit_module'`

```typescript
import { AuditModuleDict } from 'moyan-mfw-base/shared'
```

| 值 | 标签 | Type |
|----|------|------|
| `AUTH = 'AUTH'` | 认证 | `primary` |
| `USER = 'USER'` | 用户 | `success` |
| `ROLE = 'ROLE'` | 角色 | `warning` |
| `PERMISSION = 'PERMISSION'` | 权限 | `danger` |
| `APP = 'APP'` | 应用 | `primary` |
| `APP_TYPE = 'APP_TYPE'` | 应用类型 | `info` |
| `MEMBER = 'MEMBER'` | 成员 | `success` |
| `SYSTEM = 'SYSTEM'` | 系统 | `warning` |
| `UPLOAD = 'UPLOAD'` | 上传 | `info` |

---

## 批量导入

```typescript
import {
  StatusDict,
  BoolDict,
  GenderDict,
  DeveloperDict,
  IsBuiltinDict,
  IsOwnerDict,
  MultiAppEnabledDict,
  PermissionTypeDict,
  NodeTypeDict,
  ShowModeDict,
  IsAutoSyncDict,
  IsVisibleDict,
  IsCacheDict,
  AuditModuleDict,
} from 'moyan-mfw-base/shared'
```

# 06 · 核心实体（Entities）

## 目录

- [`Base`](#base) — 实体基类（软删除）
- [`User (UserEntity)`](#user-userentity) — 用户实体
- [`Role`](#role) — 角色实体
- [`Permission`](#permission) — 权限实体
- [`AppType`](#apptype) — 应用类型实体
- [`App`](#app) — 应用实例实体
- [`AppMember`](#appmember) — 应用成员实体
- [`AuditLog`](#auditlog) — 审计日志实体

---

## `Base`

所有实体必须继承的基类。提供软删除和审计时间戳。

```typescript
import { Base } from 'moyan-mfw-base/backend'

@Entity('my_table')
export class MyEntity extends Base {
  @PrimaryGeneratedColumn('uuid')
  id: string
}
```

### 自动字段

| 字段 | 类型 | 装饰器 | 说明 |
|------|------|--------|------|
| `createdAt` | `Date` | `@CreateDateColumn` | 创建时自动设置 |
| `updateAt` | `Date` | `@UpdateDateColumn` | 每次更新自动刷新 |
| `deleteAt` | `Date \| null` | `@DeleteDateColumn` | 软删除时间戳，`null` 表示未删除 |

> TypeORM 的软删除需配合 `repository.softDelete()` / `repository.softRemove()` 使用。

---

## `User` (UserEntity)

用户实体（表名 `sys_users`）。

```typescript
import { User as UserEntity } from 'moyan-mfw-base/backend'
```

> 由于 `@User()` 装饰器已占用 `User` 名称，实体以 `UserEntity` 别名导出。

---

## `Role`

角色实体（表名 `sys_roles`）。

```typescript
import { Role } from 'moyan-mfw-base/backend'
```

关联表：`sys_user_roles`（UserRole）、`sys_role_permissions`（RolePermission）。

---

## `Permission`

权限实体（表名 `sys_permissions`）。

```typescript
import { Permission } from 'moyan-mfw-base/backend'
```

关键字段：`permCode`（权限编码）、`permStatus`（状态）、`nodeType`（节点类型）、`showMode`（显示模式）。

---

## `AppType`

应用类型实体（表名 `sys_app_types`）。定义应用分类和内置角色。

```typescript
import { AppType } from 'moyan-mfw-base/backend'
```

---

## `App`

应用实例实体（表名 `sys_apps`）。`AppType` 的实例化。

```typescript
import { App } from 'moyan-mfw-base/backend'
```

---

## `AppMember`

应用成员实体（表名 `sys_app_members`）。记录用户与应用实例的归属关系。

```typescript
import { AppMember } from 'moyan-mfw-base/backend'
```

---

## `AuditLog`

审计日志实体（表名 `sys_audit_logs`）。由 `AuditInterceptor` 自动写入。

```typescript
import { AuditLog } from 'moyan-mfw-base/backend'
```

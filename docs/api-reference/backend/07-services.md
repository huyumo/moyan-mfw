# 07 · 核心服务（Services）

MFW 提供 9 个 NestJS `@Injectable()` 服务，覆盖认证、用户、角色、权限、应用、审计等核心领域。开发者可在自己的 Service 中通过 NestJS DI 注入使用。

## 目录

- [`AuthService`](#authservice) — 认证服务
- [`UserService`](#userservice) — 用户管理
- [`RoleService`](#roleservice) — 角色管理
- [`PermissionService`](#permissionservice) — 权限管理
- [`AppTypeService`](#apptypeservice) — 应用类型管理
- [`AppService`](#appservice) — 应用实例管理
- [`AppMemberService`](#appmemberservice) — 应用成员管理
- [`AuditLogService`](#auditlogservice) — 审计日志查询
- [`InstallService`](#installservice) — 系统初始化

---

## `AuthService`

认证服务（`modules/sys/auth/auth.service.ts`）。处理登录、Token 刷新、用户信息、应用列表、权限等。

```typescript
import { AuthService } from 'moyan-mfw-base/backend'
```

常用方法：

| 方法 | 说明 |
|------|------|
| `login(dto: LoginDto)` | 用户登录，返回 Token |
| `refreshToken(refreshToken: string)` | 刷新 Token |
| `getCurrentUser(userId: string)` | 获取当前用户信息 |
| `getUserApps(userId: string)` | 获取用户的应用列表 |
| `getUserPermissions(userId: string, appId?: string)` | 获取用户权限树 |

---

## `UserService`

用户管理服务。

```typescript
import { UserService } from 'moyan-mfw-base/backend'
```

---

## `RoleService`

角色管理服务。

```typescript
import { RoleService } from 'moyan-mfw-base/backend'
```

---

## `PermissionService`

权限管理服务。

```typescript
import { PermissionService } from 'moyan-mfw-base/backend'
```

---

## `AppTypeService`

应用类型管理服务。

```typescript
import { AppTypeService } from 'moyan-mfw-base/backend'
```

---

## `AppService`

应用实例管理服务。

```typescript
import { AppService } from 'moyan-mfw-base/backend'
```

---

## `AppMemberService`

应用成员管理服务。

```typescript
import { AppMemberService } from 'moyan-mfw-base/backend'
```

---

## `AuditLogService`

审计日志查询服务。由 `AuditInterceptor` 内部调用写入，业务层通常只用其 `findAll()` 查询。

```typescript
import { AuditLogService } from 'moyan-mfw-base/backend'
```

---

## `InstallService`

系统初始化服务，负责首次安装时的数据初始化。

```typescript
import { InstallService } from 'moyan-mfw-base/backend'
```

---

## 依赖注入示例

```typescript
import { Injectable } from '@nestjs/common'
import { AuthService, UserService } from 'moyan-mfw-base/backend'

@Injectable()
export class CustomService {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  async doSomething() {
    const user = await this.authService.getCurrentUser('some-id')
    // ...
  }
}
```

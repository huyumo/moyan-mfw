# 后端 · 实体与服务

## 基类 `Base`

所有实体建议继承 `Base`，自动获得软删除与时间字段：

```typescript
import { Base } from 'moyan-mfw-base/backend';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('merchant')
export class Merchant extends Base {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, comment: '店铺名称' })
  merchantName: string;
}
```

`Base` 提供：`createdAt` / `updatedAt` / `deletedAt`（软删除）。

## 核心实体

| 实体 | 表 | 说明 |
|------|-----|------|
| `UserEntity`（`User`） | sys_users | 用户（isDeveloper、userStatus） |
| `Role` | sys_roles | 角色（roleCode、isBuiltin、isOwner） |
| `Permission` | sys_permissions | 权限点（树形：MENU/PAGE/TAG，permCode、showMode） |
| `AppType` | sys_app_types | 应用类型（multiAppEnabled、权限池） |
| `App` | sys_apps | 应用实例（appCode、appStatus、owner） |
| `AppMember` | sys_app_members | 应用成员（成员-角色绑定） |
| `AuditLog` | sys_audit_logs | 审计日志 |

```typescript
import { UserEntity, Role, Permission, AppType, App, AppMember, AuditLog } from 'moyan-mfw-base/backend';
```## 核心服务

| 服务 | 职责 | 关键方法 |
|------|------|----------|
| `AuthService` | 登录/注册/刷新/登出/权限菜单 | `login` / `register` / `refreshToken` / `getUserPermissions` / `syncPermissions` |
| `UserService` | 用户管理 | `create` / `findAll` / `update` / `resetPassword` |
| `RoleService` | 角色管理（含权限分配） | `create` / `assignPermissions` |
| `PermissionService` | 权限点管理 | 树查询/增删改 |
| `AppService` | 应用实例管理 | `create` / `update` / `changeOwner` |
| `AppMemberService` | 成员管理 | `addMember` / `updateRoles` / `removeMember` |
| `AppTypeService` | 应用类型管理 | 类型与权限池管理 |
| `AuditLogService` | 审计日志查询 | `findAll` |
| `InstallService` | 系统初始化 | `isInitialized` / `initialize` |

```typescript
import { AuthService, UserService, RoleService } from 'moyan-mfw-base/backend';

@Injectable()
export class MyService {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}
}
```

## 使用规范

1. 业务实体继承 `Base`，主键使用 `@PrimaryGeneratedColumn('uuid')`。
2. 业务扩展表通过 `appId` 关联框架应用实例（由 `AppEntitySpi` 同步维护，见 [SPI](./spi.md)）。
3. 不要直接修改框架 `sys_*` 表结构；需要扩展字段时用业务侧扩展实体（如 `supplier_member_profile`）关联。
4. 修改密码、登录等安全操作一律走 `AuthService` / 对应控制器接口，不要自己实现加密。
5. 软删除实体查询记得过滤 `deletedAt`（TypeORM 软删除自动处理）。

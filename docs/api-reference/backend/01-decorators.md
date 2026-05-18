# 01 · 控制器装饰器

## 目录

- [`@Public()`](#public) — 标记接口为公开访问
- [`@RequirePermission()`](#requirepermission) — 标记接口所需权限
- [`@SkipPermission()`](#skippermission) — 跳过权限校验
- [`@AuditLog()`](#auditlog) — 记录审计日志
- [`@ApiPaginatedResponse()`](#apipaginatedresponse) — 分页接口 Swagger 文档
- [`@User()`](#user) — 提取当前用户信息
- [`@AppId()`](#appid) — 提取当前应用实例 ID
- [`createBusinessPermissionDecorator()`](#createbusinesspermissiondecorator) — 创建业务层权限装饰器

---

## `@Public()`

标记接口为公开接口，跳过 `AuthGuard` 的 JWT 认证检查。

```typescript
import { Public } from 'moyan-mfw-base/backend'

@Controller('auth')
export class AuthController {
  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {}
}
```

> 常量 `IS_PUBLIC_KEY`（值为 `'isPublic'`）也可导入，用于自定义认证逻辑中读取元数据。

---

## `@RequirePermission()`

标记接口所需的权限，配合 `PermissionGuard` 使用。

### 调用方式

支持两种调用形式和多装饰器 OR 逻辑：

```typescript
import { RequirePermission } from 'moyan-mfw-base/backend'

// 对象形式 — 只需要 permCode（如"查看"不需要位运算值）
@RequirePermission({ permCode: 'system:user-list' })

// 对象形式 — 需要指定权限值
@RequirePermission({ permCode: 'system:user-list', permissionValue: ['添加', '编辑'] })

// 简化形式 — 单参数
@RequirePermission('system:user-list')

// 简化形式 — 双参数
@RequirePermission('system:user-list', ['添加', '编辑'])

// 多次注解（OR 逻辑）：用户匹配任意一个即可
@RequirePermission('system:user-list')
@RequirePermission('system:role')
@Get()
async findAll() {}
```

### `RequirePermissionOptions` 类型

```typescript
interface RequirePermissionOptions {
  permCode: string         // 权限编码，如 'system:user-list'
  permissionValue?: string[]  // 权限位运算值名称数组，如 ['添加', '编辑']
}
```

> 常量 `REQUIRE_PERMISSION`（值为 `'require_permission'`）也可导入。

---

## `@SkipPermission()`

标记接口跳过 `PermissionGuard` 的权限检查。已通过 `AuthGuard` 认证的用户可直接访问。

```typescript
import { SkipPermission } from 'moyan-mfw-base/backend'

@Controller('upload')
export class UploadController {
  @SkipPermission()
  @Post()
  async uploadFile() {}
}
```

> 常量 `SKIP_PERMISSION_KEY`（值为 `'skip_permission'`）也可导入。

---

## `@AuditLog()`

标记接口需要记录审计日志。配合 `AuditInterceptor` 使用。

### `AuditLogOptions`

```typescript
interface AuditLogOptions {
  module: AuditModule | string   // 所属模块
  event: string                  // 事件名称
  description?: string           // 事件描述
}
```

### `AuditModule` 枚举

| 成员 | 值 |
|------|-----|
| `AUTH` | `'AUTH'` |
| `USER` | `'USER'` |
| `ROLE` | `'ROLE'` |
| `PERMISSION` | `'PERMISSION'` |
| `APP` | `'APP'` |
| `APP_TYPE` | `'APP_TYPE'` |
| `MEMBER` | `'MEMBER'` |
| `SYSTEM` | `'SYSTEM'` |
| `UPLOAD` | `'UPLOAD'` |

### 示例

```typescript
import { AuditLog, AuditModule } from 'moyan-mfw-base/backend'

@Controller('users')
export class UserController {
  @AuditLog({ module: AuditModule.USER, event: 'CREATE_USER', description: '创建用户' })
  @Post()
  async create(@Body() dto: CreateUserDto) {}

  // 也支持自定义字符串
  @AuditLog({ module: 'EC_SHOP', event: 'SHIP_ORDER', description: '发货' })
  @Post('ship')
  async ship(@Body() dto: ShipDto) {}
}
```

> 常量 `AUDIT_LOG`（值为 `'audit_log'`）也可导入。

---

## `@ApiPaginatedResponse()`

为分页接口自动生成 Swagger 响应文档。

```typescript
import { ApiPaginatedResponse } from 'moyan-mfw-base/backend'

@Controller('users')
export class UserController {
  @Get()
  @ApiPaginatedResponse(UserResponseDto)
  async findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query)
  }
}
```

在 Swagger 文档中将展示 `PageResponseDto`（`total`、`page`、`pageSize`、`totalPages`、`hasNext`、`hasPrev`）内嵌 `UserResponseDto` 的 `list` 数组。

---

## `@User()`

从经过 `AuthGuard` 认证的请求中提取用户信息。

```typescript
import { User, UserDto } from 'moyan-mfw-base/backend'

@Controller('users')
export class UserController {
  // 获取完整用户信息
  @Get('profile')
  async getProfile(@User() user: UserDto) {
    return { userId: user.id, username: user.username }
  }

  // 获取单个属性
  @Get('my-posts')
  async getMyPosts(@User('id') userId: string) {
    return this.postService.findByUserId(userId)
  }

  // 获取角色 ID 列表
  @Get('roles')
  async getRoles(@User('roleIds') roleIds: string[]) {
    return this.roleService.findByIds(roleIds)
  }
}
```

`UserDto` 的可用属性见 [11-types-and-dtos.md](./11-types-and-dtos.md)。

---

## `@AppId()`

从请求中自动解析当前操作的应用实例 ID。

解析优先级：路由 params > 请求 body > 请求 query > 请求头 `X-App-Id`。

```typescript
import { AppId } from 'moyan-mfw-base/backend'

@Controller('apps')
export class AppController {
  @Get(':appId/members')
  async getMembers(@AppId() appId: string) {
    return this.service.getMembers(appId)
  }

  @Post('create')
  async create(@Body() dto: CreateDto, @AppId() appId: string) {
    return this.service.create(appId, dto)
  }
}
```

---

## `createBusinessPermissionDecorator()`

创建带类型推断的业务层权限装饰器工厂。业务层只需调用一次，其余控制器即可享受完整类型提示。

```typescript
import { createBusinessPermissionDecorator } from 'moyan-mfw-base/backend'

// backend/src/permissions.ts
export const BUSINESS_PERMISSION_VALUES = ['上架', '发货', '退款'] as const
export const RequireBusinessPermission =
  createBusinessPermissionDecorator(BUSINESS_PERMISSION_VALUES)

// backend/src/modules/product/product.controller.ts
import { RequireBusinessPermission } from '../permissions'

@Controller('products')
export class ProductController {
  @RequireBusinessPermission('ec:product', ['上架', '发货']) // 有完整类型推断
  @Post('publish')
  async publish() {}
}
```

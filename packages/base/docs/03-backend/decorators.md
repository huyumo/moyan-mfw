# 后端 · 装饰器

所有装饰器从 `moyan-mfw-base/backend` 导出。

## `@Public()` — 公开接口（跳过认证）

标记后无需 Token 即可访问。携带有效 Token 时 AuthGuard 仍会解析用户，可配合 `@User()` 使用。

```typescript
import { Public } from 'moyan-mfw-base/backend';

@Public()
@Post('login')
async login(@Body() dto: LoginDto) {}
```

## `@Permission(permCode, permissionValue?)` — 权限校验

> 早期版本名为 `@RequirePermission`，当前推荐使用业务工厂生成的 `@Permission`（带类型推断）。

标记接口所需权限点（permCode）与操作权限值（权限名称数组）。类级别与方法级别均可使用；支持多个装饰器 OR 语义。

```typescript
// 方式一：对象形式
@RequirePermission({ permCode: 'system:user-list', permissionValue: ['添加', '编辑'] })

// 方式二：简化形式
@RequirePermission('system:user-list', ['添加'])

// 方式三：多次注解（满足任意一个即可，OR）
@RequirePermission('system:user-list')
@RequirePermission('system:role')
```

### 业务权限装饰器工厂 `createBusinessPermissionDecorator(values)`

业务层推荐用法：注册业务权限值并生成带类型推断的装饰器，避免手写字符串权限名。

```typescript
// backend/src/permissions.ts
import { createBusinessPermissionDecorator } from 'moyan-mfw-base/backend';
import { BUSINESS_PERMISSION_VALUES } from 'moyan-mfw-shared';

export const Permission = createBusinessPermissionDecorator(BUSINESS_PERMISSION_VALUES);

// controller 中使用（有完整类型提示）
@Permission('supplier:manage', ['上架', '发货', '添加'])
```

## `@SkipPermission()` — 跳过权限校验（仍需登录）

```typescript
@SkipPermission()
@Get('handlers')
listHandlers() {}
```

## `@User(property?)` — 注入当前登录用户

```typescript
import { User } from 'moyan-mfw-base/backend';

@Get('profile')
getProfile(@User() user: UserDto) {}        // 完整用户

@Get('my-posts')
getMyPosts(@User('id') userId: string) {}   // 单个属性
```

## `@AppId()` — 注入当前应用实例 ID

解析优先级：路由 params `appId` > body `appId` > query `appId` > 请求头 `X-App-Id`。

```typescript
@Get(':appId/members')
getMembers(@AppId() appId: string) {}
```

## `@AppInfo(property?)` — 注入当前应用实例信息

需配合全局 `AppInfoInterceptor`（框架已注册）。返回 `AppInfoDto`（id / appCode / appName / appTypeCode 等）。

```typescript
@Get('permissions')
getPermissions(@AppInfo() app: AppInfoDto, @AppInfo('appCode') appCode: string) {}
```

## `@AuditLog({ module, event, description })` — 审计日志

标记需要记录审计日志的接口。**注意**：必须配合 `AuditInterceptor` 使用（在业务模块中注册，框架默认未全局注册审计拦截器）。

```typescript
import { AuditLog, AuditModule } from 'moyan-mfw-base/backend';

@AuditLog({ module: AuditModule.USER, event: 'CREATE_USER', description: '创建用户' })
@Post()
async create(@Body() dto: CreateUserDto) {}
```

`AuditModule` 枚举：`AUTH / USER / ROLE / PERMISSION / APP / APP_TYPE / MEMBER / SYSTEM / UPLOAD`。

## `@ApiPaginatedResponse(dataDto)` — 分页 Swagger 响应

```typescript
@Get()
@ApiPaginatedResponse(UserResponseDto)
async findAll(@Query() query: QueryUserDto) {}
```

## 缓存装饰器

`@Cacheable` / `@CacheEvict`（详见 [缓存](./cache.md)）：

```typescript
import { Cacheable, CacheEvict } from 'moyan-mfw-base/backend';

@Cacheable({ ttl: 60 })          // 缓存 60 秒
async findById(id: string) {}

@CacheEvict({ keys: ['user:*'] }) // 清除缓存
async update(id: string) {}
```

## 使用规范

1. 控制器类上声明 `@ApiTags` 与类级 `@Permission`，方法上只写需要额外操作的权限。
2. 无需登录的接口用 `@Public()`；需要登录但不需要权限点的用 `@SkipPermission()`。
3. 业务层不要直接用 `@RequirePermission` 字符串形式，优先 `createBusinessPermissionDecorator` 生成的装饰器。
4. 不要使用 `@Req()` / `@Res()` / `@Request()` / `@Response()`（项目 ESLint 禁止），用 `@User()` / `@AppId()` / `@AppInfo()` 替代。
5. Swagger 装饰器（`@ApiTags` 等）统一从 `moyan-mfw-core` 导入（项目 ESLint 规则）。

## 已废弃装饰器

| 旧 API | 状态 | 替代 |
|--------|------|------|
| `@RequirePermission('code')` | 保留兼容 | 推荐 `@Permission`（业务工厂生成） |
| `@NoAuth` / `@IgnoreAuth` | 已移除 | `@Public()` |

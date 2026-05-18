# moyan-mfw-base/backend API 参考手册

## 概览

`moyan-mfw-base/backend` 是 MFW 框架的后端基础包，基于 NestJS + TypeORM + MySQL + Redis + JWT 构建。它通过 `createBaseBackendApp()` 工厂函数封装了完整的后端启动流程：CORS、认证守卫、权限守卫、验证管道、日志/转换/审计拦截器、全局异常过滤器等，开箱即用。

## 导入方式

```typescript
import { createBaseBackendApp } from 'moyan-mfw-base/backend'
```

## 文档导航

| 文档 | 内容 |
|------|------|
| [00-quick-start.md](./00-quick-start.md) | 应用工厂函数、扩展包启动、配置选项、应用实例 API |
| [01-decorators.md](./01-decorators.md) | 控制器装饰器：`@Public` / `@RequirePermission` / `@AuditLog` / `@ApiPaginatedResponse` / `@User` / `@AppId` / `@SkipPermission` |
| [02-guards.md](./02-guards.md) | `AuthGuard`（JWT 认证） / `PermissionGuard`（位运算权限） |
| [03-interceptors.md](./03-interceptors.md) | `LoggingInterceptor` / `TransformInterceptor` / `AuditInterceptor` |
| [04-filters.md](./04-filters.md) | `AllExceptionsFilter` 全局异常过滤器 |
| [05-exceptions.md](./05-exceptions.md) | `BusinessException` / `NotFoundError` / `ForbiddenError` / `UnauthorizedError` |
| [06-entities.md](./06-entities.md) | 核心实体：`Base` / `User` / `Role` / `Permission` / `App` / `AppType` / `AppMember` / `AuditLog` |
| [07-services.md](./07-services.md) | 核心服务：`AuthService` / `UserService` / `RoleService` / `PermissionService` / `AppService` / `InstallService` 等 |
| [08-pagination.md](./08-pagination.md) | `PaginationX` 分页工具 / `PaginationResult` / `PaginationQueryDto` |
| [09-query-building.md](./09-query-building.md) | `WhereBuilder` / `QueryBuilderHelper` / `QueryCondition` / `executeRawSql` |
| [10-permission-system.md](./10-permission-system.md) | 权限常量与工具函数：`buildPerValue` / `getPermValue` / `parsePerValue` / `hasPermission` / `registerPermissionValues` |
| [11-types-and-dtos.md](./11-types-and-dtos.md) | 公共类型与 DTO：`UserInfo` / `PageQuery` / `PageResult` / `ApiResponse` / `UserDto` / `ImageResourceDto` 等 |
| [12-tools.md](./12-tools.md) | 工具函数：`hashPassword` / `verifyPassword` / `flatToTree` / `treeToFlat` |
| [13-seeds.md](./13-seeds.md) | 数据库种子：`runSeeds` / `seedDicts` / `syncAppTypesConfig` |

## 请求处理管道

```
HTTP Request
  → CORS
  → AuthGuard (JWT 认证，@Public 装饰器可跳过)
  → PermissionGuard (位运算权限，@SkipPermission 可跳过)
  → ValidationPipe (白名单 + 自动转换)
  → LoggingInterceptor
  → Controller
  → AuditInterceptor (@AuditLog 装饰器触发)
  → TransformInterceptor (统一响应包装)
  → AllExceptionsFilter (异常统一处理)
  → HTTP Response
```

## 最小启动示例

```typescript
import { createBaseBackendApp } from 'moyan-mfw-base/backend'

async function bootstrap() {
  const { listen } = await createBaseBackendApp({
    name: 'MyApp',
    database: {
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '123456',
      database: 'myapp',
    },
    jwt: {
      secret: 'my-jwt-secret',
      expiresIn: 7200,
    },
    cors: true,
    permissionValues: ['发货', '充值', '审批'],
    syncAppTypes: true,
    appTypes: [{
      typeName: '电商后台',
      typeCode: 'ec_admin',
      multiAppEnabled: 1,
      builtinRole: [{
        roleCode: 'ec_admin',
        roleName: '电商管理员',
        isOwner: 1,
      }],
    }],
  })

  await listen(3000)
}

bootstrap()
```

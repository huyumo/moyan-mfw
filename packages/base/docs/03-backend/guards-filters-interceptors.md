# 后端 · 守卫 / 过滤器 / 拦截器

## 全局守卫

`createBaseBackendApp` 自动注册两个全局守卫（按顺序执行）：

### `AuthGuard`（JWT 认证）

- 校验 `Authorization: Bearer <token>`，解析并注入 `request.user`。
- `@Public()` 接口跳过认证（未携带 Token 放行，携带则解析用户）。
- Token 失效/黑名单（Redis）时抛出 401。

### `PermissionGuard`（位运算权限）

- 读取类/方法上的 `@RequirePermission` / `@Permission` 元数据。
- 无权限元数据 → 放行（只要求已认证）。
- 有元数据 → 校验用户在当前应用下的角色权限值（BigInt 按位与）。
- `@SkipPermission()` 跳过；开发者（`isDeveloper: 1`）直接放行。
- 校验失败抛出 403。

## 全局过滤器

### `AllExceptionsFilter`

统一异常出口，将异常转换为统一响应格式：

```json
{ "code": <业务码>, "data": null, "message": "错误信息", "timestamp": "..." }
```

处理规则：

| 异常 | HTTP 状态码 |
|------|-------------|
| `UnauthorizedError` | 401 |
| `ForbiddenError` | 403 |
| `NotFoundError` | 404 |
| `BusinessException` | 400（自定义 code/message） |
| class-validator 校验失败 | 400 |
| 其他未知异常 | 500 |

## 全局拦截器（框架默认注册）

| 拦截器 | 职责 | 注册方式 |
|--------|------|----------|
| `LoggingInterceptor` | 请求/响应日志（方法、耗时、状态码） | 全局（`useGlobalInterceptors`） |
| `TransformInterceptor` | 统一响应包装 `{ code: 0, data, message, timestamp }` | 全局 |
| `CacheInterceptor` | `@Cacheable` / `@CacheEvict` 缓存读写 | 全局（DI，`APP_INTERCEPTOR`） |
| `AppInfoInterceptor` | 解析当前应用信息注入 `request.app`（供 `@AppInfo` 使用） | 全局（DI） |

### 可选：`AuditInterceptor`

审计拦截器**不会**自动注册，需要在业务模块中显式提供：

```typescript
// 业务模块 providers 中注册
import { AuditInterceptor } from 'moyan-mfw-base/backend';

@Module({
  providers: [{ provide: APP_INTERCEPTOR, useClass: AuditInterceptor }],
})
export class BusinessModule {}
```

配合控制器方法上的 `@AuditLog({ module, event, description })` 使用，将操作写入 `sys_audit_logs`。## 异常类

```typescript
import { BusinessException, NotFoundError, ForbiddenError, UnauthorizedError } from 'moyan-mfw-base/backend';

throw new BusinessException('库存不足', 10001);   // code 业务码，默认 400
throw new NotFoundError('用户不存在');            // 404
throw new ForbiddenError('无权操作');             // 403
throw new UnauthorizedError('登录已过期');         // 401
```

业务层也可以直接使用 NestJS 内置的 `NotFoundException` 等，过滤器同样会统一处理。

## 使用规范

1. 不要重复注册 `LoggingInterceptor` / `TransformInterceptor`（框架已全局注册）。
2. 需要审计的接口使用 `@AuditLog`，并确保 `AuditInterceptor` 已在模块中注册。
3. 控制器方法返回原始数据即可，无需手动包装 `{ code, data }`。
4. 自定义拦截器/过滤器请通过 `options.providers`（APP_INTERCEPTOR）注入，而不是依赖遗留的 `options.interceptors` / `options.exceptionFilters`（工厂未消费）。

# 03 · 拦截器（Interceptors）

## 目录

- [`LoggingInterceptor`](#logginginterceptor) — 请求日志拦截器
- [`TransformInterceptor`](#transforminterceptor) — 响应格式统一转换
- [`AuditInterceptor`](#auditinterceptor) — 审计日志拦截器
- [请求管道中的位置](#请求管道中的位置)

---

## `LoggingInterceptor`

记录每个请求的方法、URL、HTTP 状态码和执行耗时（毫秒）。

```
[LoggingInterceptor] GET /api/users - 200 - 45ms
```

该拦截器由 `createBaseBackendApp()` 自动注册为全局拦截器，无需手动配置。

---

## `TransformInterceptor`

将控制器返回的原始数据统一包装为标准响应格式：

```json
{
  "code": 0,
  "data": { ... },
  "message": "success",
  "timestamp": "2026-05-18T12:00:00.000Z"
}
```

### 特殊行为

- **已是标准格式的数据直接透传**：若返回值已包含 `code` 字段（如 `BusinessException` 的响应），不做二次包装。
- **自动 `instanceToPlain`**：使用 `class-transformer` 将 DTO 实例转为普通对象，触发 `@Transform` / `@Exclude` 等装饰器。

---

## `AuditInterceptor`

配合 `@AuditLog()` 装饰器使用。当控制器方法带有 `@AuditLog()` 时，在请求成功后自动向 `sys_audit_log` 表写入一条审计记录。

### 记录的字段

| 字段 | 来源 |
|------|------|
| `module` | `@AuditLog({ module: ... })` |
| `event` | `@AuditLog({ event: ... })` |
| `description` | `@AuditLog({ description: ... })` |
| `operatorId` | `request.user.id` |
| `operatorName` | `request.user.username` |
| `ip` | `request.ip` |
| `userAgent` | `request.headers['user-agent']` |

> 审计日志写入失败不会影响接口正常响应。错误会被 catch 并记录日志，然后透传原始响应。

---

## 请求管道中的位置

```
HTTP Request
  → AuthGuard
  → PermissionGuard
  → ValidationPipe
  → LoggingInterceptor   ← 请求进入时记录
  → Controller            ← 业务处理
  → AuditInterceptor      ← @AuditLog 触发时写入审计日志
  → TransformInterceptor  ← 响应包装
  → HTTP Response
```

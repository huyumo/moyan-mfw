# 04 · AllExceptionsFilter 全局异常过滤器

`AllExceptionsFilter` 捕获应用中所有未处理的异常，统一转换为标准错误响应格式并记录日志。

该过滤器由 `createBaseBackendApp()` 自动注册，无需手动配置。

---

## 标准错误响应格式

```json
{
  "code": 10003,
  "message": "权限不足",
  "data": null,
  "timestamp": "2026-05-18T12:00:00.000Z",
  "path": "/api/users/list"
}
```

---

## 异常类型 → 错误码映射

| 异常类型 | HTTP 状态码 | `code` | `details` |
|----------|-------------|--------|-----------|
| `BadRequestException`（ValidationPipe） | 400 | `10001` | `[{ field, message }]` |
| `ConflictException` | 409 | `10002` | — |
| `ForbiddenException` | 403 | `10003` | — |
| `NotFoundError`（自定义） | 404 | `10004` | — |
| `NotFoundException` | 404 | `10004` | — |
| `UnauthorizedException` | 401 | `401` | — |
| `BusinessException`（自定义） | 继承 `status` | 继承 `code` | 继承 `details` |
| 普通 `Error` | 500 | `50000` | — |
| 未知异常 | 500 | `50000` | — |

---

## 自定义错误码范围

对于非标准 HTTP 状态码的 `BusinessException`，过滤器会按范围映射：

| 错误码范围 | 映射 HTTP 状态码 |
|------------|----------------|
| `40000 - 40999` | `401 UNAUTHORIZED` |
| `42000 - 42999` | `400 BAD_REQUEST` |
| `43000 - 43999` | `403 FORBIDDEN` |
| `44000 - 44999` | `404 NOT_FOUND` |

---

## 验证错误 details 格式

当 `ValidationPipe` 触发验证错误时，`details` 字段返回字段级错误数组：

```json
{
  "code": 10001,
  "message": "参数验证失败",
  "details": [
    { "field": "username", "message": "username must be a string" },
    { "field": "password", "message": "password must be longer than or equal to 6 characters" }
  ]
}
```

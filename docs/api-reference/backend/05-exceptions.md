# 05 · 异常类（Exceptions）

## 目录

- [`BusinessException`](#businessexception) — 业务异常基类
- [`NotFoundError`](#notfounderror) — 资源不存在
- [`ForbiddenError`](#forbiddenerror) — 权限不足
- [`UnauthorizedError`](#unauthorizederror) — 未授权

---

## 类继承关系

```
HttpException (NestJS)
  └── BusinessException (框架基类)
        ├── NotFoundError
        ├── ForbiddenError
        └── UnauthorizedError
```

---

## `BusinessException`

所有业务异常的基类。抛出后由 `AllExceptionsFilter` 统一处理。

### 构造函数

```typescript
constructor(message: string, status?: HttpStatus | number)
```

- `message`：异常消息
- `status`：HTTP 状态码或自定义错误码，默认 `400`

### 响应格式

```json
{ "code": 400, "message": "操作失败", "data": null, "timestamp": "..." }
```

### 示例

```typescript
import { BusinessException } from 'moyan-mfw-base/backend'

// 默认 400
throw new BusinessException('用户名已存在')

// 指定 HTTP 状态码
throw new BusinessException('无权访问', HttpStatus.FORBIDDEN)

// 自定义错误码（用于前端区分不同错误）
throw new BusinessException('账户余额不足', 42001)
```

---

## `NotFoundError`

资源不存在的专用异常，继承 `BusinessException`，HTTP 状态码 `404`。

```typescript
import { NotFoundError } from 'moyan-mfw-base/backend'

throw new NotFoundError('用户')
// → { code: 404, message: '资源不存在：用户', data: null }
```

---

## `ForbiddenError`

权限不足的专用异常，HTTP 状态码 `403`。

```typescript
import { ForbiddenError } from 'moyan-mfw-base/backend'

throw new ForbiddenError()
// → { code: 403, message: '权限不足', data: null }
```

---

## `UnauthorizedError`

未授权的专用异常，HTTP 状态码 `401`。

```typescript
import { UnauthorizedError } from 'moyan-mfw-base/backend'

throw new UnauthorizedError()
// → { code: 401, message: '未授权，请先登录', data: null }

// 自定义消息
throw new UnauthorizedError('Token 已过期，请重新登录')
```

# 11 · 公共类型与 DTO

所有类型均可通过 `moyan-mfw-base/backend` 直接导入。

---

## `UserDto`

AuthGuard 解析后挂载到 `request.user` 的用户信息结构。

```typescript
import { UserDto } from 'moyan-mfw-base/backend'
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 用户 ID |
| `username` | `string` | 用户名 |
| `roleIds` | `string[]` | 角色 ID 列表 |
| `isDeveloper` | `number` | 是否开发者（1=是） |

---

## `UserInfo`

用户信息接口（用于服务层返回）。

```typescript
import type { UserInfo } from 'moyan-mfw-base/backend'

interface UserInfo {
  id: string
  username: string
  nickname?: string
  phone?: string
  email?: string
  avatar?: string
  gender: number
  isDeveloper: boolean
  status: number
  roles: string[]
}
```

---

## `LoginDto`

登录请求参数。

```typescript
import type { LoginDto } from 'moyan-mfw-base/backend'

interface LoginDto {
  username: string
  password: string
}
```

---

## `PageQuery` / `PageResult`

分页查询泛型接口。

```typescript
import type { PageQuery, PageResult } from 'moyan-mfw-base/backend'

interface PageQuery {
  page: number
  pageSize: number
}

interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
```

---

## `ApiResponse` / `ErrorResponse`

标准 API 响应类型。

```typescript
import type { ApiResponse, ErrorResponse } from 'moyan-mfw-base/backend'

interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
  timestamp: string
}

interface ErrorResponse {
  code: number
  message: string
  data: null
  timestamp: string
  path: string
  details?: any
}
```

---

## `ApiResponseUtil`

静态工具类，便捷创建标准响应对象。

```typescript
import { ApiResponseUtil } from 'moyan-mfw-base/backend'
```

---

## 资源类型 DTO

```typescript
import {
  ImageResourceDto,
  MediaResourceDto,
  FileResourceDto,
  ResourceType,  // enum { IMAGE, MEDIA, FILE }
} from 'moyan-mfw-base/backend'
```

| DTO | 字段 |
|-----|------|
| `ImageResourceDto` | `src`, `width?`, `height?`, `alt?` |
| `MediaResourceDto` | `src`, `type?`, `cover?`, `duration?` |
| `FileResourceDto` | `src`, `name?`, `size?`, `type?` |

---

## `CommonOptions`

公共选项接口。

```typescript
import type { CommonOptions } from 'moyan-mfw-base/backend'

interface CommonOptions {
  appId?: string
  userId?: string
  [key: string]: any
}
```

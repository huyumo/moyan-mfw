# 08 · 分页查询（PaginationX）

基于原生 SQL 的分页查询工具，支持多 SQL 批量执行和灵活的排序/分页配置。

## 目录

- [`PaginationQueryDto`](#paginationquerydto) — 分页请求参数 DTO
- [`PaginationX`](#paginationx) — 分页查询构建器
- [`PaginationResult`](#paginationresult) — 分页结果类型

---

## `PaginationQueryDto`

标准分页请求参数 DTO，自带 Swagger 和校验装饰器。

```typescript
import { PaginationQueryDto } from 'moyan-mfw-base/backend'
```

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | `number` | `1` | 页码 |
| `pageSize` | `number` | `10` | 每页条数 |
| `sortField` | `string?` | — | 排序字段 |
| `sortOrder` | `'ASC' \| 'DESC'?` | — | 排序方向 |

### 使用示例

```typescript
@Controller('users')
export class UserController {
  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    // query.page = 1, query.pageSize = 10
  }
}
```

---

## `PaginationX`

链式分页查询构建器。

### 创建实例

```typescript
import { PaginationX } from 'moyan-mfw-base/backend'

const paginator = new PaginationX(dataSource, { page: 1, pageSize: 10 })
```

### 方法链

```
.setSelect(sql)     → 设置主查询的 SELECT + FROM + JOIN 部分
.addCountSql(sql)   → 添加 COUNT 子查询（可选，不设置则自动包裹）
.setGroupBy(sql)    → 设置 GROUP BY
.setOrderBy(sql)    → 设置 ORDER BY
.addSql({tag, sql}) → 添加额外的独立 SQL（与分页无关的统计数据等）
.execute()          → 执行并返回 PaginationResult
```

### 完整示例

```typescript
import { PaginationX, PaginationQueryDto } from 'moyan-mfw-base/backend'

async function findUsersPaginated(dataSource: DataSource, query: PaginationQueryDto) {
  const result = await new PaginationX(dataSource, query)
    .setSelect(`
      SELECT u.*, r.name as roleName
      FROM sys_users u
      LEFT JOIN sys_user_roles ur ON u.id = ur.userId
      LEFT JOIN sys_roles r ON ur.roleId = r.id
    `)
    .setOrderBy('ORDER BY u.createdAt DESC')
    .execute()

  // result.list  → 数据列表
  // result.total → 总条数
  // result.page  → 当前页码
  return result
}
```

---

## `PaginationResult`

```typescript
class PaginationResult<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}
```

---

## 反模式警告

> ✋ 避免 `repository.find({ skip, take })` 做分页 → 应使用 `PaginationX` + `WhereBuilder` 组合。

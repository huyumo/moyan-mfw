# 后端 · 分页与查询

## `PaginationX` — 原生 SQL 分页查询

基于原生 SQL 的分页查询工具，支持多 SQL 批量执行、多个 WHERE 构建器、自定义数据处理。适用于复杂报表类查询。

```typescript
import { PaginationX, PaginationQueryDto, WhereBuilder } from 'moyan-mfw-base/backend';

async findAll(query: PaginationQueryDto) {
  const whereBuilder = new WhereBuilder();
  whereBuilder.eq('status', query.status).like('name', query.keyword);

  const pager = new PaginationX(this.dataSource, query);
  pager
    .where('main', whereBuilder)
    .select('id, name, status, created_at')
    .defaultOrderBy('created_at DESC')
    .sql(({ select, wheres, orderBy, limit }) => {
      return `SELECT ${select} FROM users ${wheres.main} ${orderBy} ${limit}`;
    });

  const result = await pager.getData();
  // result: PaginationResult<T> { list, total, page, pageSize, totalPages }
  return result;
}
```

### 链式 API

| 方法 | 说明 |
|------|------|
| `select(sql)` | 设置 select 字段 SQL |
| `where(name, whereBuilder)` | 注册命名 WHERE 构建器（可在 SQL 中通过 `wheres[name]` 引用） |
| `sql(fn)` | SQL 生成函数，入参 `{ select, limit, orderBy, wheres, ...params }` |
| `defaultOrderBy(sql)` | 默认排序（查询参数未指定 sortField 时生效） |
| `unshiftSql(opts)` / `pushSql(opts)` | 在查询 SQL 前/后追加附加 SQL（`toData` 结果并入 `pageData`，`isGetOne` 取单条） |
| `pipe(fn)` | 结果管道（拿到 pager 与原始 results 做后处理） |
| `printSql()` | 调试：打印最终 SQL |
| `getData(dataProcessor?, beforeProcessor?)` | 执行并返回分页结果 |
| `noTotal` | 构造参数 `true` 时跳过 COUNT 查询 |## `WhereBuilder` — 条件构建器

```typescript
const wb = new WhereBuilder();
wb.eq('status', 1)          // =
  .neq('type', 'x')         // <>
  .gt('age', 18)            // >
  .gte('score', 60)         // >=
  .lt('price', 100)         // <
  .lte('price', 50)         // <=
  .in('id', ['a', 'b'])     // IN
  .notIn('id', ['c'])       // NOT IN
  .like('name', '张')       // LIKE %张%
  .isNull('deletedAt')      // IS NULL
  .isNotNull('phone')       // IS NOT NULL
  .group(subBuilder)        // 子条件分组（AND）
  .group(subBuilder2, 'OR');// 子条件分组（OR）

const { where, params } = wb.build();
// where: 'WHERE status = :status_0 AND ...'（无条件时为空字符串）
// params: { status_0: 1, ... }
```

## `QueryBuilderHelper` — TypeORM 查询构建辅助

面向 TypeORM QueryBuilder 的条件组合工具，用法与 WhereBuilder 类似：

```typescript
import { QueryBuilderHelper, QueryCondition, ConditionGroup } from 'moyan-mfw-base/backend';

const qb = this.repository.createQueryBuilder('u');
const helper = new QueryBuilderHelper();
// 通过 helper 组合条件后应用到 qb
```

## `executeRawSql(dataSource, sql, params)`

执行原生 SQL（参数化，防注入）：

```typescript
import { executeRawSql } from 'moyan-mfw-base/backend';

const rows = await executeRawSql(this.dataSource, 'SELECT * FROM users WHERE id = :id', { id: 'abc' });
```

## `PaginationQueryDto`

标准分页查询 DTO：`page`（默认 1）/ `pageSize`（默认 10）/ `sortField` / `sortOrder`（ASC|DESC）。业务查询 DTO 可继承它扩展筛选字段：

```typescript
import { PaginationQueryDto } from 'moyan-mfw-base/backend';
import { IsOptional, IsString } from 'class-validator';

export class QueryUserDto extends PaginationQueryDto {
  @IsOptional() @IsString()
  keyword?: string;
}
```

## 使用规范

1. 简单 CRUD 优先 TypeORM Repository 查询；复杂报表/多表聚合用 `PaginationX`。
2. 永远使用参数化查询（`executeRawSql` / WhereBuilder），禁止拼接 SQL。
3. 分页接口响应直接返回 `PaginationResult`，前端 `MfwListPage` 的 `loadData` 返回 `{ list, total }` 即可。

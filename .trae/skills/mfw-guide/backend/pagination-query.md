---
version: "1.0"
last_updated: "2026-04-25"
scope: backend
triggers:
  - 分页查询
  - WhereBuilder
  - SQL 构建
  - PaginationX
dependencies: []
maturity: stable
tags: [后端, 分页, WhereBuilder, SQL, 查询]
---

# 分页查询规范

## 核心规则

**禁止使用 TypeORM QueryBuilder 做分页查询**，项目已统一迁移到 `PaginationX + WhereBuilder`，基于原生 SQL，参数化防注入。

## 标准写法

```typescript
async findAll(query: QueryXxxDto): Promise<PaginationResult<XxxResponseDto>> {
  const { name, status } = query;
  const whereBuilder = new WhereBuilder();
  whereBuilder.like('xxx.name', name).eq('xxx.status', status);

  const pager = new PaginationX(this.dataSource, query);
  return await pager
    .where('main', whereBuilder)
    .sql(({ select, wheres, orderBy, limit }) => {
      const whereClause = wheres?.main || '';
      return `SELECT ${select} FROM sys_xxx xxx ${whereClause} ${orderBy} ${limit}`;
    })
    .select('xxx.*')
    .defaultOrderBy('xxx.createdAt DESC')
    .getData();
}
```

## WhereBuilder 常用方法

| 方法 | 操作符 | 说明 |
|------|--------|------|
| `eq(field, val)` | = | 等于（undefined 自动跳过） |
| `neq(field, val)` | != | 不等于 |
| `like(field, val)` | LIKE %val% | 模糊查询 |
| `likeLeft(field, val)` | LIKE val% | 左模糊 |
| `in(field, vals)` | IN | IN 条件 |
| `between(field, start, end)` | BETWEEN | 范围查询 |
| `isNull(field)` | IS NULL | 空值判断 |
| `group(builder, op)` | () | 条件分组（支持 OR） |

## 条件分组示例

```typescript
const sub1 = new WhereBuilder();
sub1.eq('role.isBuiltin', 1).isNull('role.appId');
const sub2 = new WhereBuilder();
sub2.eq('role.appId', appId);
const outer = new WhereBuilder();
outer.group(sub1).group(sub2, 'OR');
```

## 调试

`pager.printSql()` 打印 SQL 到控制台。

## 反模式（Red Flags）— 立即停止

- ✋ 使用 TypeORM `createQueryBuilder` 做分页查询 → 使用 `PaginationX + WhereBuilder`（例外：复杂关联查询/子查询 PaginationX 不支持时，可使用 QueryBuilder，但须经 Review 确认，并注意手动处理分页参数）
- ✋ 在 Service 中直接 `this.xxxRepository.find()` 做列表查询 → 使用 `PaginationX`
- ✋ 手写 SQL 拼接 WHERE 条件（SQL 注入风险）→ 使用 `WhereBuilder` 参数化构建
- ✋ 忘记调用 `getData()` → PaginationX 需链式调用 `.getData()` 获取结果
- ✋ 在 `sql()` 回调中直接拼接用户输入 → 通过 WhereBuilder 参数化传入

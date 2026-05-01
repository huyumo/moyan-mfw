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

## PaginationX 常用方法

| 方法 | 说明 |
|------|------|
| `where(name, builder)` | 绑定 WhereBuilder，name 为条件标签 |
| `sql(fn)` | 设置 SQL 生成函数，接收 `{ select, wheres, orderBy, limit }` |
| `select(sql)` | 设置 SELECT 字段（默认 `*`） |
| `defaultOrderBy(order)` | 设置默认排序（无用户排序时生效） |
| `getData(processor?, before?)` | 执行查询并返回分页结果 |
| `printSql()` | 打印 SQL 到控制台（调试用） |
| `pipe(fn)` | 设置结果后处理函数 |
| `setDbName(name)` | 设置数据库连接别名（默认 `default`） |
| `unshiftSql(opts)` | 在 SQL 数组前面插入额外 SQL |
| `pushSql(opts)` | 在 SQL 数组后面追加额外 SQL |
| `getResultByTag(tag, isGetOne?)` | 根据 tag 获取已执行 SQL 的查询结果 |
| `exec(done?)` | 执行 SQL 并返回 this（不自动分页） |

## WhereBuilder 常用方法

| 方法 | 操作符 | 说明 |
|------|--------|------|
| `eq(field, val, op?)` | = | 等于（undefined 自动跳过，op 为逻辑连接符 AND/OR） |
| `neq(field, val, op?)` | != | 不等于 |
| `gt(field, val, op?)` | > | 大于 |
| `gte(field, val, op?)` | >= | 大于等于 |
| `lt(field, val, op?)` | < | 小于 |
| `lte(field, val, op?)` | <= | 小于等于 |
| `like(field, val, op?)` | LIKE %val% | 模糊查询 |
| `likeLeft(field, val, op?)` | LIKE val% | 左模糊 |
| `likeRight(field, val, op?)` | LIKE %val | 右模糊 |
| `in(field, vals, op?)` | IN | IN 条件 |
| `notIn(field, vals, op?)` | NOT IN | NOT IN 条件 |
| `between(field, min, max, op?)` | BETWEEN | 范围查询 |
| `isNull(field, op?)` | IS NULL | 空值判断 |
| `isNotNull(field, op?)` | IS NOT NULL | 非空判断 |
| `custom(condition, params?, op?)` | 自定义 | 自定义条件字符串 |
| `andWhere(field, operator, val)` | AND | 通用 AND 条件（自定义操作符） |
| `orWhere(field, operator, val)` | OR | 通用 OR 条件（自定义操作符） |
| `group(builder, op?)` | () | 条件分组（支持 OR） |
| `reset()` | — | 重置构建器 |

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

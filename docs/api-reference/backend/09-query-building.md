# 09 · 查询条件构建（QueryBuilderHelper + WhereBuilder + executeRawSql）

## 目录

- [`QueryBuilderHelper`](#querybuilderhelper) — TypeORM QueryBuilder 条件封装
- [`WhereBuilder`](#wherebuilder) — 原生 SQL WHERE 条件构建器
- [`executeRawSql`](#executerawsql) — 执行原生 SQL
- [何时使用哪个](#何时使用哪个)

---

## `QueryBuilderHelper`

为 TypeORM 的 `SelectQueryBuilder` 提供链式条件构建。

### 导入

```typescript
import { QueryBuilderHelper, QueryCondition, ConditionGroup } from 'moyan-mfw-base/backend'
```

### `QueryCondition` 接口

```typescript
interface QueryCondition<T = any> {
  field: string           // 字段名（带别名），如 'appType.typeName'
  value?: T               // 查询值
  operator?:              // 操作符，默认 '='
    | '=' | '!=' | '>' | '<' | '>=' | '<='
    | 'like' | 'like_left' | 'like_right'
    | 'in' | 'not_in' | 'between'
    | 'is_null' | 'is_not_null'
  paramName?: string      // 参数名（默认同 field）
  logicalOperator?: 'AND' | 'OR'  // 默认 'AND'
}
```

### 使用方式

```typescript
const qb = repository.createQueryBuilder('user')
  .leftJoinAndSelect('user.roles', 'role')

QueryBuilderHelper.applyConditions(qb, [
  { field: 'user.username', value: dto.username, operator: 'like' },
  { field: 'user.status', value: dto.status, operator: '=' },
  { field: 'user.age', value: dto.age, operator: '>' },
])

const [list, total] = await qb.getManyAndCount()
```

### `ConditionGroup` — 嵌套条件组

```typescript
interface ConditionGroup {
  logicalOperator: 'AND' | 'OR'
  conditions: (QueryCondition | ConditionGroup)[]
}
```

---

## `WhereBuilder`

原生 SQL 的 WHERE 条件构建器，自动过滤 `undefined`/`null` 值，生成参数化 SQL 防止注入。

### 导入

```typescript
import { WhereBuilder } from 'moyan-mfw-base/backend'
```

### 链式方法

```typescript
const builder = new WhereBuilder()
  .eq('status', 'active')       // WHERE status = :status_0
  .ne('type', 'deleted')        // AND type != :type_1
  .gt('age', 18)                // AND age > :age_2
  .gte('score', 60)             // AND score >= :score_3
  .lt('price', 100)             // AND price < :price_4
  .lte('count', 50)             // AND count <= :count_5
  .like('name', '张')           // AND name LIKE :name_6 (%张%)
  .likeLeft('name', '张')       // AND name LIKE :name_7 (%张)
  .likeRight('name', '张')      // AND name LIKE :name_8 (张%)
  .in('type', ['A', 'B'])       // AND type IN (:type_9, :type_10)
  .notIn('type', ['C'])         // AND type NOT IN (:type_11)
  .between('age', 18, 60)       // AND age BETWEEN :age_12 AND :age_13
  .isNull('deletedAt')          // AND deletedAt IS NULL
  .isNotNull('email')           // AND email IS NOT NULL
  .raw('user.status = 1')       // AND user.status = 1（原始片段，慎用）

// 使用 OR 逻辑：第三个参数传 'OR'
builder.eq('type', 'admin', 'OR')   // OR type = :type_14
```

### `build()` 返回

```typescript
const { where, params } = builder.build()
// where: "WHERE status = :status_0 AND age > :age_1"
// params: { status_0: 'active', age_1: 18 }
```

### 与 `PaginationX` 组合

```typescript
const builder = new WhereBuilder()
  .eq('status', dto.status)
  .like('username', dto.keyword)
const { where, params } = builder.build()

const result = await new PaginationX(dataSource, query)
  .setSelect(`SELECT u.* FROM sys_users u ${where}`)
  .execute(params)
```

---

## `executeRawSql`

执行原生 SQL，将命名参数（`:param`）直接替换到 SQL 中执行。

```typescript
import { executeRawSql } from 'moyan-mfw-base/backend'

const result = await executeRawSql(dataSource,
  'SELECT * FROM users WHERE id = :userId AND status = :status',
  { userId: '123', status: 'active' }
)
```

> 注意：此函数通过字符串替换实现参数化，非 Prepared Statement。确保参数值来自可信来源。

---

## 何时使用哪个

| 场景 | 推荐工具 |
|------|----------|
| TypeORM Repository 查询 + 动态条件 | `QueryBuilderHelper` |
| 原生 SQL 查询 + 动态 WHERE | `WhereBuilder` + `executeRawSql` |
| 原生 SQL 分页 | `PaginationX` + `WhereBuilder` |
| 简单查询（无条件） | 直接用 TypeORM `repository.find()` |

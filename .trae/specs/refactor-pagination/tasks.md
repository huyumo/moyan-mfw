# Tasks

## 重构任务列表

### 任务 1: 重构 app-member.service.ts 中的分页查询
- [ ] 使用 PaginationX + WhereBuilder 重构 app-member.service.ts 中的分页查询方法
- [ ] 验证重构后的功能正确性

### 任务 2: 重构 user.service.ts 中的分页查询
- [ ] 使用 PaginationX + WhereBuilder 重构 user.service.ts 中的分页查询方法
- [ ] 验证重构后的功能正确性

### 任务 3: 重构 app.service.ts 中的分页查询
- [ ] 使用 PaginationX + WhereBuilder 重构 app.service.ts 中的分页查询方法
- [ ] 验证重构后的功能正确性

### 任务 4: 重构 permission.service.ts 中的分页查询
- [ ] 使用 PaginationX + WhereBuilder 重构 permission.service.ts 中的分页查询方法
- [ ] 验证重构后的功能正确性

### 任务 5: 重构 role.service.ts 中的分页查询
- [ ] 使用 PaginationX + WhereBuilder 重构 role.service.ts 中的分页查询方法
- [ ] 验证重构后的功能正确性

### 任务 6: 重构 audit-log.service.ts 中的分页查询
- [ ] 使用 PaginationX + WhereBuilder 重构 audit-log.service.ts 中的分页查询方法
- [ ] 验证重构后的功能正确性

### 任务 7: 重构 app-type.service.ts 中的分页查询
- [ ] 使用 PaginationX + WhereBuilder 重构 app-type.service.ts 中的分页查询方法
- [ ] 验证重构后的功能正确性

## 重构模式

每个服务的重构模式应遵循以下模式：

```typescript
// 旧代码
const result = await PaginationHelper.executeQuery(qb, query);
return PaginationResult.fromQuery(result.list, result.total, query);

// 新代码
const whereBuilder = new WhereBuilder();
whereBuilder.eq('field', query.field);

const pager = new PaginationX(dataSource, query);
pager
  .where('main', whereBuilder)
  .sql(({select, wheres, orderBy, limit}) => {
    return `SELECT ${select} FROM table_name ${wheres.main} ${orderBy} ${limit}`;
  });

const result = await pager.getData();
return result;
```

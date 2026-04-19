# Checklist

## 代码重构检查清单

### app-member.service.ts
- [ ] 已导入 PaginationX 和 WhereBuilder
- [ ] 已移除 PaginationHelper 和 PaginationResult 的导入
- [ ] 分页查询方法已使用 PaginationX 重构
- [ ] WhereBuilder 条件构建正确
- [ ] sql() 回调函数参数正确解构

### user.service.ts
- [ ] 已导入 PaginationX 和 WhereBuilder
- [ ] 已移除 PaginationHelper 和 PaginationResult 的导入
- [ ] 分页查询方法已使用 PaginationX 重构
- [ ] WhereBuilder 条件构建正确
- [ ] sql() 回调函数参数正确解构

### app.service.ts
- [ ] 已导入 PaginationX 和 WhereBuilder
- [ ] 已移除 PaginationHelper 和 PaginationResult 的导入
- [ ] 分页查询方法已使用 PaginationX 重构
- [ ] WhereBuilder 条件构建正确
- [ ] sql() 回调函数参数正确解构

### permission.service.ts
- [ ] 已导入 PaginationX 和 WhereBuilder
- [ ] 已移除 PaginationHelper 和 PaginationResult 的导入
- [ ] 分页查询方法已使用 PaginationX 重构
- [ ] WhereBuilder 条件构建正确
- [ ] sql() 回调函数参数正确解构

### role.service.ts
- [ ] 已导入 PaginationX 和 WhereBuilder
- [ ] 已移除 PaginationHelper 和 PaginationResult 的导入
- [ ] 分页查询方法已使用 PaginationX 重构
- [ ] WhereBuilder 条件构建正确
- [ ] sql() 回调函数参数正确解构

### audit-log.service.ts
- [ ] 已导入 PaginationX 和 WhereBuilder
- [ ] 已移除 PaginationHelper 和 PaginationResult 的导入
- [ ] 分页查询方法已使用 PaginationX 重构
- [ ] WhereBuilder 条件构建正确
- [ ] sql() 回调函数参数正确解构

### app-type.service.ts
- [ ] 已导入 PaginationX 和 WhereBuilder
- [ ] 已移除 PaginationHelper 和 PaginationResult 的导入
- [ ] 分页查询方法已使用 PaginationX 重构
- [ ] WhereBuilder 条件构建正确
- [ ] sql() 回调函数参数正确解构

## 通用检查
- [ ] 所有 PaginationHelper.executeQuery 调用已替换
- [ ] 所有 PaginationResult.fromQuery 调用已替换
- [ ] PaginationHelper 导入已移除
- [ ] PaginationResult 导入已移除
- [ ] dataSource 正确传入 PaginationX 构造函数
- [ ] query 参数正确传入 PaginationX 构造函数

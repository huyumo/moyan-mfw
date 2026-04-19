# 分页查询重构规范

## Why
当前项目中存在多个服务使用旧的 `PaginationHelper` 和 `PaginationResult` 类进行分页查询，需要统一迁移到新的 `PaginationX` 分页框架，以提高代码复用性和维护性。

## What Changes
- 将 7 个服务文件中的分页查询从 `PaginationHelper` / `PaginationResult` 重构为 `PaginationX` + `WhereBuilder`
- 受影响文件：
  - app-member.service.ts
  - user.service.ts
  - app.service.ts
  - permission.service.ts
  - role.service.ts
  - audit-log.service.ts
  - app-type.service.ts

## Impact
- Affected specs: 分页查询功能
- Affected code: 7 个服务类文件

## ADDED Requirements
### Requirement: 统一分页查询
所有服务层的分页查询必须使用 `PaginationX` 类配合 `WhereBuilder` 构建。

#### Scenario: 使用 PaginationX 进行分页查询
- **WHEN** 服务需要执行分页查询时
- **THEN** 使用 `PaginationX` 创建分页实例，通过 `where()` 方法添加 `WhereBuilder` 条件构建器
- **AND** 使用 `sql()` 方法传入 SQL 生成回调函数
- **AND** 调用 `getData()` 获取分页结果

#### Scenario: 使用 WhereBuilder 构建查询条件
- **WHEN** 需要构建复杂的 WHERE 条件时
- **THEN** 使用 `WhereBuilder` 类提供的方法（如 `eq`, `gt`, `like`, `in` 等）
- **AND** 支持自动过滤 `undefined` 值
- **AND** 支持条件分组（括号）

## MODIFIED Requirements
### Requirement: 分页结果结构
旧的 `PaginationResult` 包含 `list`, `total`, `page`, `pageSize`, `totalPages`, `hasNext`, `hasPrev`。
新的 `PaginationX.pageData` 包含 `list`, `total`, `page`, `pageSize`, `totalPages`。
如果需要 `hasNext` 和 `hasPrev`，应在业务层计算。

## REMOVED Requirements
### Requirement: PaginationHelper
**Reason**: 功能已被 `PaginationX` 取代
**Migration**: 使用 `PaginationX` 的 `where()` 和 `sql()` 方法替代

### Requirement: PaginationResult
**Reason**: 分页结果结构已更改
**Migration**: 使用 `PaginationX.getData()` 返回的 `pageData` 替代

---
task: 权限系统改进 - permissionValue 位运算优化
status: completed
priority: P0
started: 2026-04-07
completed: 2026-04-07
updated: 2026-04-07 00:00
session: session-20260407-000000
lock: 1746226200
assignee: @user
---

## 当前目标
✅ 已完成 permissionValue 位运算权限系统优化

## 已完成
- [x] 创建后端全局权限常量 `PERMISSION_VALUES` 数组
- [x] 编写后端 `buildPerValue` 工具函数（字符串数组 → bigint）
- [x] 修改 `@RequirePermission` 装饰器支持字符串数组和多次注解
- [x] 修改 `PermissionGuard` 支持多装饰器 OR 检查和字符串转换
- [x] 更新 `permission.controller.ts` 使用新的字符串数组格式
- [x] 前端同步实现 `PERMISSION_VALUES` 和 `buildPerValue` 工具函数
- [x] 更新前端 `PermissionTreeNodeDto` 类型（permissionValue 改为 string）
- [x] 自测试验证（类型检查通过 ✅）

## 进行中
- [ ] 无

## 待开始
- [ ] 无

## 相关文件
- `packages/base-backend/src/common/constants/permissions.ts` (新增)
- `packages/base-backend/src/common/decorators/require-permission.decorator.ts` (修改)
- `packages/base-backend/src/common/guards/permission.guard.ts` (修改)
- `packages/base-backend/src/common/index.ts` (修改，导出权限常量)
- `packages/base-backend/src/modules/sys/permission/permission.controller.ts` (修改)
- `packages/base-frontend/src/utils/permissions.ts` (新增，工具函数)
- `packages/base-frontend/src/apis/sys/schemas.ts` (修改)
- `packages/base-frontend/src/apis/sys/index.ts` (修改，导出权限常量)

## 实现细节

### 1. 权限常量定义（前后端统一）

```typescript
export const PERMISSION_VALUES = [
  '查看', '添加', '编辑', '删除', '导出', '导入', '审批', '拒绝', '发布', '归档'
] as const
```

### 2. 位运算映射

| 权限名 | 索引 | 位运算值 | 十进制 |
|--------|------|----------|--------|
| 查看 | 0 | 1n << 0 | 1n |
| 添加 | 1 | 1n << 1 | 2n |
| 编辑 | 2 | 1n << 2 | 4n |
| 删除 | 3 | 1n << 3 | 8n |
| 导出 | 4 | 1n << 4 | 16n |
| 导入 | 5 | 1n << 5 | 32n |
| 审批 | 6 | 1n << 6 | 64n |
| 拒绝 | 7 | 1n << 7 | 128n |
| 发布 | 8 | 1n << 8 | 256n |
| 归档 | 9 | 1n << 9 | 512n |

### 3. 使用方式

```typescript
// 方式 1：字符串数组（唯一推荐方式）
@RequirePermission({ permCode: 'system:permission', permissionValue: ['查看', '添加'] })

// 方式 2：多次注解（OR 逻辑）
@RequirePermission({ permCode: 'system:permission', permissionValue: ['查看'] })
@RequirePermission({ permCode: 'system:role', permissionValue: ['查看'] })
```

### 4. 工具函数

| 函数 | 说明 | 示例 |
|------|------|------|
| `buildPerValue(names)` | 字符串数组 → bigint | `buildPerValue(['查看', '添加'])` → 3n |
| `getPermValue(name)` | 单个权限名 → bigint | `getPermValue('查看')` → 1n |
| `parsePerValue(value)` | bigint → 字符串数组 | `parsePerValue(7n)` → ['查看', '添加', '编辑'] |
| `hasPermission(value, name)` | 检查是否包含权限 | `hasPermission(7n, '查看')` → true |
| `mergePermissions(...values)` | 合并多个权限值 | `mergePermissions(1n, 2n)` → 3n |

## 自测试验证（CLAUDE.md 步骤 5.5）
- 后端类型检查：通过 ✅ (`npx tsc --noEmit`)
- 前端类型检查：通过 ✅ (`pnpm run typecheck:vue`)
- 单元测试：91/91 通过 ✅ (前端 91 个测试用例)
- 项目启动：后端编译通过 ✅

## 关键决策
- 权限名称使用中文，便于理解和维护
- 前后端共享同一套权限常量定义
- API 传输使用字符串格式（JSON 不支持 bigint）
- 支持多次注解，OR 逻辑检查权限

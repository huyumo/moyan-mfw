---
task: 种子数据与权限菜单修复
status: completed
priority: P0
started: 2026-04-07
updated: 2026-04-07 18:10
session: session-20260407-180000
lock: 1744074600
assignee: @ai
---

## 当前目标

修复种子数据缺少应用实例初始化，导致 API 返回空数据的问题。

## 已完成

- [x] 种子数据添加应用实例初始化（seedAppInstances）
- [x] 修复全局角色权限菜单返回空的问题
- [x] 修复种子数据唯一键冲突错误
- [x] 添加 UserPermissionsDto @IsUUID() 验证
- [x] 修复 BigInt 序列化错误（PermissionGuard 中 TypeORM 返回字符串）

### 修复的问题

| 问题 | 原因 | 修复方案 | 状态 |
|------|------|---------|------|
| /api/auth/apps 返回空数组 | 种子数据没有初始化应用实例 | 新增 seedAppInstances()，为 admin 创建"系统管理后台" | ✅ |
| /api/auth/permissions 返回空菜单 | 全局角色没有被正确识别 | 添加 isGlobalRole 判断逻辑 | ✅ |
| 种子数据执行失败 | permCode 唯一键冲突 | 移除 permissionType 条件，添加 try-catch | ✅ |
| UserPermissionsDto 验证失败 | 缺少验证装饰器 | 添加 @IsUUID() | ✅ |
| /api/permissions/tree/all BigInt 序列化错误 | TypeORM 返回的 permissionValue 是字符串而非 BigInt | PermissionGuard 添加类型转换：`typeof rp.permissionValue === 'string' ? BigInt(rp.permissionValue) : rp.permissionValue` | ✅ |

### 验证结果

```bash
# 应用列表 API
GET /api/auth/apps
{"code":0,"data":{"apps":[{"appId":"1cc0411e-3d62-491c-9746-ee7d5282401c","appName":"系统管理后台",...}]},"message":"获取成功"}

# 权限菜单 API
GET /api/auth/permissions?appId=1cc0411e-3d62-491c-9746-ee7d5282401c
{"code":0,"data":{"menuTree":[...],"permissions":[22 个权限编码],...},"message":"获取成功"}

# 权限树 API
GET /api/permissions/tree/all?permissionType=PC
{"code":0,"data":[{"id":"e7b01801-9008-470e-9c1d-88559999b395","permName":"PC 权限根节点","permCode":"pc_root",...}],"message":"查询成功"}
```

## 进行中

- [ ] 无

## 待开始

- [ ] 无

## 相关文件

- `packages/base-backend/src/database/seeds/index.ts` - 种子数据
- `packages/base-backend/src/modules/sys/auth/auth.service.ts` - 权限菜单逻辑
- `packages/base-backend/src/modules/sys/auth/dto/req/user-permissions.dto.ts` - DTO 验证
- `packages/base-backend/src/common/guards/permission.guard.ts` - 权限守卫（BigInt 转换修复）

## 备注

种子数据执行后创建的应用实例 ID：`1cc0411e-3d62-491c-9746-ee7d5282401c`

## 关键修复

### BigInt 序列化错误修复

**问题**：`/api/permissions/tree/all` 返回 `Cannot mix BigInt and other types` 错误

**根本原因**：TypeORM 的 `bigint` 列在 MySQL 中返回的是**字符串**，而非 JavaScript BigInt 对象

**修复位置**：`packages/base-backend/src/common/guards/permission.guard.ts:92-101`

**修复代码**：
```typescript
const rpPermValue = typeof rp.permissionValue === 'string'
  ? BigInt(rp.permissionValue)
  : (rp.permissionValue as bigint);
```

**影响范围**：所有使用 `@RequirePermission` 装饰器的接口

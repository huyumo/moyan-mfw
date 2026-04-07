---
task: 种子数据与权限菜单修复
status: completed
priority: P0
started: 2026-04-07
updated: 2026-04-07 18:15
session: session-20260407-180000
lock: 1744074900
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
- [x] 修复 menuTree 返回 NORMAL 权限类型问题（system 应用类型只应返回 PC 权限）
- [x] 修复 filterVisibleNodes 过滤逻辑（父节点不可见时子节点提升为根节点）

### 修复的问题

| 问题 | 原因 | 修复方案 | 状态 |
|------|------|---------|------|
| /api/auth/apps 返回空数组 | 种子数据没有初始化应用实例 | 新增 seedAppInstances()，为 admin 创建"系统管理后台" | ✅ |
| /api/auth/permissions 返回空菜单 | 全局角色没有被正确识别 | 添加 isGlobalRole 判断逻辑 | ✅ |
| 种子数据执行失败 | permCode 唯一键冲突 | 移除 permissionType 条件，添加 try-catch | ✅ |
| UserPermissionsDto 验证失败 | 缺少验证装饰器 | 添加 @IsUUID() | ✅ |
| /api/permissions/tree/all BigInt 序列化错误 | TypeORM 返回的 permissionValue 是字符串而非 BigInt | PermissionGuard 添加类型转换：`typeof rp.permissionValue === 'string' ? BigInt(rp.permissionValue) : rp.permissionValue` | ✅ |
| /api/auth/permissions 返回 NORMAL 权限类型 | getUserPermissions 没有根据应用类型过滤权限类型 | 添加 permissionType 过滤 + 权限池过滤逻辑 | ✅ |
| menuTree 为空（根节点 isVisible=0） | filterVisibleNodes 直接过滤掉不可见父节点，子节点丢失 | 修改逻辑：父节点不可见时，子节点提升为根节点 | ✅ |

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
- `packages/base-backend/src/modules/sys/auth/auth.service.ts` - 权限菜单逻辑（主要修复）
- `packages/base-backend/src/modules/sys/auth/auth.module.ts` - 添加 AppTypePermissionEntity 依赖
- `packages/base-backend/src/modules/sys/auth/dto/req/user-permissions.dto.ts` - DTO 验证
- `packages/base-backend/src/common/guards/permission.guard.ts` - 权限守卫（BigInt 转换修复）
- `packages/base-backend/src/modules/sys/app-type/entities/app-type-permission.entity.ts` - 应用类型权限池实体

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

### menuTree 返回 NORMAL 权限类型修复

**问题**：system 应用类型（PC 权限）的菜单中包含了 `permissionType: "NORMAL"` 的数据

**根本原因**：
1. 种子数据中 admin 角色绑定了所有权限（PC + NORMAL）
2. `getUserPermissions` 方法没有根据应用类型过滤权限类型

**修复位置**：`packages/base-backend/src/modules/sys/auth/auth.service.ts`

**修复代码**：
```typescript
// 根据应用类型决定允许的权限类型
const allowedPermissionType = appType?.typeCode === 'system'
  ? PermissionType.PC
  : PermissionType.NORMAL;

rolePermissions.forEach((rp) => {
  if (rp.permission && rp.permission.permStatus === 1) {
    // 过滤：权限类型必须匹配
    if (rp.permission.permissionType !== allowedPermissionType) {
      return;
    }
    // ... 其他过滤逻辑
  }
});
```

**验证结果**：
```bash
GET /api/auth/permissions?appId=1cc0411e-3d62-491c-9746-ee7d5282401c
{"code":0,"data":{"menuTree":[...],"permissions":["pc_root:business:reports",...],"appTypeId":"f7eecf8d-0576-4935-bbc9-ca22b9b4bb9f"}}
# 所有权限都是 PC 类型，不再包含 business:view 等 NORMAL 权限
```

### filterVisibleNodes 过滤逻辑修复

**问题**：`pc_root` 根节点 `isVisible=0`，导致所有子节点被过滤掉，menuTree 返回空数组

**修复位置**：`packages/base-backend/src/modules/sys/auth/auth.service.ts:559-571`

**修复代码**：
```typescript
private filterVisibleNodes(nodes: PermissionTreeNodeDto[]): PermissionTreeNodeDto[] {
  const result: PermissionTreeNodeDto[] = [];
  for (const node of nodes) {
    if (node.isVisible === 1) {
      // 当前节点可见，保留
      const newNode = { ...node };
      if (node.children && node.children.length > 0) {
        newNode.children = this.filterVisibleNodes(node.children);
      }
      result.push(newNode);
    } else {
      // 当前节点不可见，递归处理子节点（子节点提升为根节点）
      if (node.children && node.children.length > 0) {
        const visibleChildren = this.filterVisibleNodes(node.children);
        result.push(...visibleChildren);
      }
    }
  }
  return result;
}
```

**验证结果**：
```bash
GET /api/auth/permissions?appId=1cc0411e-3d62-491c-9746-ee7d5282401c
{"code":0,"data":{"menuTree":[
  {"permName":"首页","permCode":"pc_root:dashboard",...},
  {"permName":"系统管理","permCode":"pc:system",...,"children":[
    {"permName":"用户管理","permCode":"pc:system:user",...,"children":[
      {"permName":"用户列表","permCode":"pc:system:user:list",...}
    ]}
  ]}
]}}
# menuTree 正确显示，pc_root 被过滤但其子节点提升为根节点
```

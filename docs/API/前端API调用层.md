# 前端 API 调用层

## 概述

前端 API 调用层基于 `moyan-api` 包自动生成，位于 `packages/base-frontend/src/apis/sys/` 目录。该目录下的文件由 `moyan-api` 工具生成，**禁止手动修改**。

## API 类清单

所有 API 类继承自 `ApiCall<Params, Response>` 基类，通过 `readonly path`、`readonly method`、`readonly auth` 定义接口信息。

### 认证接口 (auth)

| API 类 | 方法 | 路径 | 认证 | 功能 |
|--------|------|------|------|------|
| `ApiAuthLogin` | POST | `/api/auth/login` | 否 | 用户登录 |
| `ApiAuthRefreshToken` | POST | `/api/auth/refresh` | 否 | 刷新 Token |
| `ApiAuthGetCurrentUser` | POST | `/api/auth/userinfo` | 是 | 获取当前用户信息 |
| `ApiAuthLogout` | POST | `/api/auth/logout` | 否 | 退出登录 |
| `ApiAuthGetUserApps` | GET | `/api/auth/apps` | 是 | 获取用户应用列表 |
| `ApiAuthGetUserPermissions` | GET | `/api/auth/permissions` | 是 | 获取用户权限菜单 |
| `ApiAuthRegister` | POST | `/api/auth/register` | 否 | 用户注册 |
| `ApiAuthCheckAvailability` | GET | `/api/auth/check-availability` | 否 | 检查可用性 |
| `ApiAuthChangePassword` | POST | `/api/auth/change-password` | 是 | 修改密码 |
| `ApiAuthSyncPermissions` | POST | `/api/auth/sync-permissions` | 是 | 同步权限 |

### 用户接口 (user)

| API 类 | 方法 | 路径 | 认证 | 功能 |
|--------|------|------|------|------|
| `ApiUserCreate` | POST | `/api/users` | 是 | 创建用户 |
| `ApiUserFindAll` | GET | `/api/users` | 是 | 查询用户列表 |
| `ApiUserAdminCreate` | POST | `/api/users/admin-create` | 是 | 管理员创建用户 |
| `ApiUserFindOneByKeyword` | GET | `/api/users/find-one` | 是 | 精确查找用户 |
| `ApiUserFindById` | GET | `/api/users/{id}` | 是 | 根据ID查询用户 |
| `ApiUserUpdate` | PUT | `/api/users/{id}` | 是 | 更新用户 |
| `ApiUserDelete` | DELETE | `/api/users/{id}` | 是 | 删除用户 |
| `ApiUserUpdateStatus` | PUT | `/api/users/{id}/status` | 是 | 更新用户状态 |
| `ApiUserResetPassword` | POST | `/api/users/{id}/reset-password` | 是 | 重置密码 |

### 角色接口 (role)

| API 类 | 方法 | 路径 | 认证 | 功能 |
|--------|------|------|------|------|
| `ApiRoleCreate` | POST | `/api/roles` | 是 | 创建角色 |
| `ApiRoleFindAll` | GET | `/api/roles` | 是 | 查询角色列表 |
| `ApiRoleFindById` | GET | `/api/roles/{id}` | 是 | 根据ID查询角色 |
| `ApiRoleUpdate` | PUT | `/api/roles/{id}` | 是 | 更新角色 |
| `ApiRoleDelete` | DELETE | `/api/roles/{id}` | 是 | 删除角色 |
| `ApiRoleAssignPermissions` | POST | `/api/roles/{id}/permissions` | 是 | 分配权限 |
| `ApiRoleGetRolePermissions` | GET | `/api/roles/{id}/permissions` | 是 | 获取角色权限 |

### 权限接口 (permission)

| API 类 | 方法 | 路径 | 认证 | 功能 |
|--------|------|------|------|------|
| `ApiPermissionCreate` | POST | `/api/permissions` | 是 | 创建权限 |
| `ApiPermissionFindAll` | GET | `/api/permissions` | 是 | 查询权限列表 |
| `ApiPermissionFindAllTree` | GET | `/api/permissions/tree/all` | 是 | 查询所有权限树 |
| `ApiPermissionGetPermissionTree` | GET | `/api/permissions/tree` | 是 | 获取权限树 |
| `ApiPermissionFindById` | GET | `/api/permissions/{id}` | 是 | 根据ID查询权限 |
| `ApiPermissionUpdate` | PUT | `/api/permissions/{id}` | 是 | 更新权限 |
| `ApiPermissionDelete` | DELETE | `/api/permissions/{id}` | 是 | 删除权限 |
| `ApiPermissionBatchCreate` | POST | `/api/permissions/batch` | 是 | 批量创建权限 |
| `ApiPermissionSyncPermissions` | POST | `/api/permissions/sync` | 是 | 同步路由到权限表 |

### 应用类型接口 (app-type)

| API 类 | 方法 | 路径 | 认证 | 功能 |
|--------|------|------|------|------|
| `ApiAppTypeCreate` | POST | `/api/app-types` | 是 | 创建应用类型 |
| `ApiAppTypeFindAll` | GET | `/api/app-types` | 是 | 查询应用类型列表 |
| `ApiAppTypeFindAllList` | GET | `/api/app-types/all` | 是 | 查询所有应用类型 |
| `ApiAppTypeFindById` | GET | `/api/app-types/{id}` | 是 | 根据ID查询应用类型 |
| `ApiAppTypeUpdate` | PUT | `/api/app-types/{id}` | 是 | 更新应用类型 |
| `ApiAppTypeDelete` | DELETE | `/api/app-types/{id}` | 是 | 删除应用类型 |
| `ApiAppTypeGetPermissionPool` | GET | `/api/app-types/{appTypeId}/permission-pool` | 是 | 获取权限池配置 |
| `ApiAppTypeUpdatePermissionPool` | PUT | `/api/app-types/{appTypeId}/permission-pool` | 是 | 更新权限池配置 |
| `ApiAppTypeUpdateStatus` | PUT | `/api/app-types/{id}/status` | 是 | 更新应用类型状态 |

### 应用实例接口 (app)

| API 类 | 方法 | 路径 | 认证 | 功能 |
|--------|------|------|------|------|
| `ApiAppCreate` | POST | `/api/apps` | 是 | 创建应用实例 |
| `ApiAppFindAll` | GET | `/api/apps` | 是 | 查询应用实例列表 |
| `ApiAppFindById` | GET | `/api/apps/{id}` | 是 | 根据ID查询应用实例 |
| `ApiAppUpdate` | PUT | `/api/apps/{id}` | 是 | 更新应用实例 |
| `ApiAppDelete` | DELETE | `/api/apps/{id}` | 是 | 删除应用实例 |
| `ApiAppChangeOwner` | PUT | `/api/apps/{id}/owner` | 是 | 变更负责人 |
| `ApiAppUpdateStatus` | PUT | `/api/apps/{id}/status` | 是 | 更新应用实例状态 |

### 应用成员接口 (member)

| API 类 | 方法 | 路径 | 认证 | 功能 |
|--------|------|------|------|------|
| `ApiAppMemberAddMember` | POST | `/api/apps/{appId}/members` | 是 | 添加应用成员 |
| `ApiAppMemberGetMembers` | GET | `/api/apps/{appId}/members` | 是 | 获取应用成员列表 |
| `ApiAppMemberUpdateRoles` | PUT | `/api/apps/{appId}/members/{userId}/roles` | 是 | 更新成员角色 |
| `ApiAppMemberRemoveMember` | DELETE | `/api/apps/{appId}/members/{userId}` | 是 | 移除应用成员 |
| `ApiAppMemberGetAvailableRoles` | GET | `/api/apps/{appId}/members/available-roles` | 是 | 获取可选角色列表 |

### 审计日志接口 (audit-log)

| API 类 | 方法 | 路径 | 认证 | 功能 |
|--------|------|------|------|------|
| `ApiAuditLogFindAll` | GET | `/api/audit-logs` | 是 | 查询审计日志列表 |
| `ApiAuditLogFindById` | GET | `/api/audit-logs/{id}` | 是 | 根据ID查询审计日志 |
| `ApiAuditLogFindByTargetId` | GET | `/api/audit-logs/target/{targetId}` | 是 | 根据目标ID查询 |
| `ApiAuditLogFindByOperatorId` | GET | `/api/audit-logs/operator/{operatorId}` | 是 | 根据操作人ID查询 |
| `ApiAuditLogDeleteBeforeDate` | DELETE | `/api/audit-logs/before/{beforeDate}` | 是 | 清理审计日志 |

### 文件上传接口 (upload-file)

| API 类 | 方法 | 路径 | 认证 | 功能 |
|--------|------|------|------|------|
| `ApiUploadFileUploadFile` | POST | `/api/upload-files` | 是 | 单文件上传 |
| `ApiUploadFileUploadFiles` | POST | `/api/upload-files/batch` | 是 | 多文件上传 |

### 系统初始化接口 (install)

| API 类 | 方法 | 路径 | 认证 | 功能 |
|--------|------|------|------|------|
| `ApiInstallGetStatus` | GET | `/api/install/status` | 否 | 检查系统是否已初始化 |
| `ApiInstallInitialize` | POST | `/api/install/init` | 否 | 执行系统初始化 |

## 调用方式

```typescript
import { ApiAuthLogin, ApiUserFindAll } from 'moyan-mfw-base-frontend';

// 登录
const result = await new ApiAuthLogin({
  body: { username: 'admin', password: 'Admin@123' },
});

// 查询用户列表
const users = await new ApiUserFindAll({
  query: { page: 1, pageSize: 10 },
});
```

## 注意事项

- `apis` 目录下的文件由 `moyan-api` 工具自动生成，**禁止手动修改**
- 如需变更 API 定义，应阅读 `apis/README.md` 中的说明，使用 `moyan-api` 工具重新生成
- Schema 类型定义在 `apis/sys/schemas.ts` 中，同样为自动生成

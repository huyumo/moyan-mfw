# 后端 · 内置系统 API

所有接口挂载在全局前缀 `/api` 下。内置系统文档：`/api-docs/sys`。

## 认证 `/api/auth`

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/login` | 公开 | 登录，返回 accessToken / refreshToken / expiresIn / user |
| POST | `/refresh` | 公开 | 刷新 Token（body: `refreshToken`） |
| POST | `/logout` | 公开 | 登出（body: `token`） |
| POST | `/register` | 公开 | 用户自注册（注册后自动登录） |
| GET | `/check-availability` | 公开 | 检查用户名/邮箱/手机号可用性 |
| POST | `/userinfo` | 登录 | 当前用户详细信息 |
| GET | `/apps` | 登录 | 用户可访问的应用实例列表 |
| GET | `/permissions` | 登录 | 当前应用下权限菜单树 + permissionValueMap（appId 来自 `X-App-Id` 头或 query） |
| POST | `/sync-permissions` | 登录 | 重新加载权限 |
| POST | `/change-password` | 登录 | 修改密码 |
| POST | `/verify-developer` | 登录 | 验证开发者密码（开启开发者模式） |
| POST | `/set-developer-password` | 登录 | 设置开发者密码 |

## 用户 `/api/users`

权限点 `pc_root:sys:user`：POST `/`（添加）、GET `/`（分页）、GET `/:id`、PUT `/:id`（编辑）、DELETE `/:id`（软删）、POST `/admin-create`、PUT `/:id/status`、POST `/:id/reset-password`。

## 角色 `/api/roles`

权限点 `pc_root:sys:role`：POST `/`、GET `/`、GET `/:id`、PUT `/:id`、DELETE `/:id`（内置角色不可删）、POST `/:id/permissions`（分配权限）、GET `/:id/permissions`。

## 权限 `/api/permissions`

权限点树管理：GET 树、POST / PUT / DELETE 节点；`/api/permission-values` 提供权限值列表（前端 `fetchPermissionValues` 使用）。

## 应用类型 `/api/app-types`

应用类型与权限池管理：CRUD + `PUT /:id/permission-pool`（更新权限池）+ 自定义菜单保存。

## 应用与成员 `/api/apps`

应用实例 CRUD、`POST /:id/members`（添加成员）、`PUT /:id/members/:memberId/roles`（成员角色）、`DELETE /:id/members/:memberId`、`PUT /:id/owner`（变更拥有者）等。

## 审计日志 `/api/audit-logs`

GET 分页查询审计日志 + GET `/:id` 详情。## 系统初始化 `/api/install`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/status` | 系统是否已初始化（前端路由守卫据此跳转 `/install`） |
| POST | `/init` | 执行初始化（创建管理员、内置角色、内置应用类型；已初始化则 409 拒绝） |

## 路由同步 `/api/route-sync`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/check` | 菜单树哈希比对，返回 `needsSync`（非开发者恒为 false） |
| POST | `/sync` | 执行菜单树 → 权限/权限池/角色权限同步（仅开发者） |

## 健康检查 `/api/health`

GET 返回服务与数据库健康状态。

## 上传 `/api/upload-files`

见 [上传文档](./upload.md)。

## 统一响应

```json
{ "code": 0, "data": ..., "message": "success", "timestamp": "..." }
```

分页接口 `data` 为 `{ list, total, page, pageSize, totalPages }`。

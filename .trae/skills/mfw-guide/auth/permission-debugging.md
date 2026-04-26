---
version: "1.0"
last_updated: "2026-04-25"
scope: auth
triggers:
  - 权限排查
  - 认证
  - Token
  - 登录
  - "401"
  - "403"
  - 权限编码
dependencies:
  - routing-auth
maturity: stable
tags: [权限, 认证, Token, RBAC, 位运算, 前端, 后端]
---

# 权限与认证排查

## RBAC + 位运算模型

- 用户 → 角色（多对多，sys_user_roles）
- 角色 → 权限（多对多，sys_role_permissions，含 permissionValue 细粒度值）
- 权限池（sys_app_type_permissions）限定应用类型可用权限范围

## 位运算权限值

| 名称 | 值 | 名称 | 值 | 名称 | 值 |
|------|----|------|-----|------|-----|
| 添加 | 1n | 编辑 | 2n | 删除 | 4n |
| 导出 | 8n | 导入 | 16n | 审批 | 32n |
| 拒绝 | 64n | 发布 | 128n | 归档 | 256n |

## 后端权限声明

```typescript
@RequirePermission({ permCode: 'pc_root:sys:user' })                          // 仅查看
@RequirePermission({ permCode: 'pc_root:sys:user', permissionValue: ['添加'] }) // 需添加权限
@RequirePermission({ permCode: 'pc_root:sys:permission-pc' })                 // OR逻辑
@RequirePermission({ permCode: 'pc_root:sys:permission' })                    // 满足任一
```

- `permissionValue` 接受 `string[]`（如 `['添加', '编辑']`）
- 用户 `isDeveloper = 1` 时，后端 PermissionGuard 直接放行

## 前端权限控制

```typescript
// 页面级
export default definePageConfig({ permissions: ['添加', '编辑', '删除'] });

// 按钮级
<el-button v-permission="'添加'">新增</el-button>
<el-button v-permission="{ value: ['编辑'] }">编辑</el-button>

// 操作列
renderActionButtons([
  { label: '编辑', permission: ['编辑'], onClick: handleEdit },
  { label: '删除', permission: ['删除'], onClick: handleDelete, disabled: isBuiltin },
], {}, row)

// 代码级
const { hasPermission } = usePermission();
```

## 权限编码命名规则

- 格式：`pc_root:sys:模块名`
- PC 端管理权限前缀：`pc_root:sys:`
- 普通权限前缀：`normal_root:`
- 小写+连字符：`pc_root:sys:order-management`
- 当前编码：`user` / `role` / `permission` / `permission-pc` / `app-type` / `app` / `member` / `audit-log`

## 完整认证链路

```
用户登录 → ApiAuthLogin → accessToken + refreshToken → localStorage
   → 路由守卫 → initializeAuth()
   → fetchUserInfo() → fetchUserApps()
   → autoSelectApp() → 单应用自动选择 / 多应用需用户选择
   → selectApp(app) → loadPermissions(appId)
   → 获取权限菜单树 → 转换为侧边栏菜单 → 同步 layoutStore
   → 页面访问 → 路由守卫比对权限菜单
   → 按钮操作 → v-permission / usePermission 检查
```

## 后端认证

- AuthGuard：解析 JWT → 注入 `request.user = { id, username, roleIds }`
- `@Public()`：标记无需认证的接口
- JWT：secret + 24h 过期 + 7d 刷新
- Token 存储：`mfw:admin:token` / `mfw:admin:refresh_token`
- 当前应用存储：`mfw:admin:current_app`
- 10 分钟内过期自动刷新

## 常见排查路径

| 现象 | 排查方向 |
|------|---------|
| 接口返回 401 | Token 过期/缺失 → 检查 localStorage + 刷新机制 |
| 接口返回 403 | 权限不足 → 检查角色权限 + 权限池 + permissionValue |
| 菜单不显示 | 权限菜单树 → 检查 loadPermissions + layoutStore |
| 按钮不显示 | v-permission → 检查 usePermission + permissionValue |
| 开发者全部放行 | isDeveloper = 1 → PermissionGuard 跳过检查 |

## 反模式（Red Flags）— 立即停止

- ✋ 仅检查 `permCode` 不检查 `permissionValue` → 位运算值控制细粒度权限，必须同时校验
- ✋ 前端用 `v-if` 判断权限 → 使用 `v-permission` 指令或 `usePermission` 钩子
- ✋ 后端只加 `@RequirePermission` 不加 `permissionValue` → 默认仅查看权限，CUD 操作需指定
- ✋ 忘记在权限池中添加新权限 → 角色无法分配该权限
- ✋ 硬编码 `isDeveloper = 1` 绕过权限检查 → 仅用于开发环境调试

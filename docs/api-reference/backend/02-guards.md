# 02 · 守卫（Guards）

## 目录

- [`AuthGuard`](#authguard) — JWT 认证守卫
- [`PermissionGuard`](#permissionguard) — 位运算权限守卫
- [请求管道中的位置](#请求管道中的位置)

---

## `AuthGuard`

验证请求是否携带有效的 JWT Token。`AuthGuard` 和 `PermissionGuard` 已由 `createBaseBackendApp()` 自动注册为全局守卫，无需手动配置。

### 行为

1. 检查方法/类上是否存在 `@Public()` 装饰器 → 有则直接放行
2. 从 `Authorization: Bearer <token>` 请求头提取 Token
3. 调用 `JwtService.verifyAsync()` 验证 Token
4. 验证通过后将用户信息挂载到 `request.user`

### 注入的 `request.user` 结构

```typescript
request.user = {
  id: string        // 用户 ID（对应 JWT payload.sub）
  username: string  // 用户名
  roleIds: string[] // 角色 ID 数组
}
```

### 放行策略

| 场景 | 行为 |
|------|------|
| 带有 `@Public()` 装饰器 | 直接放行 |
| 无 Token | 抛出 `UnauthorizedException('未授权，请先登录')` |
| Token 无效/过期 | 抛出 `UnauthorizedException('Token 无效或已过期')` |
| Token 有效 | 挂载 user 到 request，放行 |

---

## `PermissionGuard`

基于位运算验证用户权限，支持多装饰器 OR 逻辑和通配符匹配。

### 行为

1. 检查是否有 `@SkipPermission()` 装饰器 → 有则直接放行
2. 检查是否有 `@RequirePermission()` 装饰器 → 无则直接放行
3. 检查 `request.user.isDeveloper === 1` → 开发者直接放行
4. 从 `RolePermission` 表查询用户角色的权限值
5. 执行位运算匹配验证

### 多装饰器 OR 逻辑

同一接口上有多个 `@RequirePermission` 时，只要匹配任意一个即可：

```typescript
@RequirePermission({ permCode: 'system:user-list' })
@RequirePermission({ permCode: 'system:role' })
@Get()
async findAll() {}  // 拥有 user-list 或 role 任一权限即可访问
```

### 通配符权限匹配

支持三种通配符模式：

| 模式 | 含义 | 示例 |
|------|------|------|
| `ext:ad:*` | 后缀通配，匹配以 `ext:ad:` 开头的权限码 | 匹配 `ext:ad:placement`、`ext:ad:campaign` |
| `*:ext:ad` | 前缀通配，匹配以 `:ext:ad` 结尾的权限码 | 匹配 `pc_root:ext:ad` |
| `*:ext:ad:*` | 前后通配，匹配包含 `ext:ad:` 的权限码 | 匹配 `pc_root:ext:ad:placement` 等 |

```typescript
@RequirePermission({ permCode: '*:ext:ad:*' })
@Get()
async findAll() {}  // 拥有扩展包 ad 下任意权限即可访问
```

### appId 级别角色作用域

`PermissionGuard` 通过 `@AppId()` 解析当前请求的 `appId`，从 `sys_user_roles` 表查询该用户在此应用下被分配的角色，确保多应用实例间的权限隔离。

---

## 请求管道中的位置

```
HTTP Request
  → CORS
  → AuthGuard          ← 此处：JWT 认证
  → PermissionGuard    ← 此处：位运算权限
  → ValidationPipe
  → Controller
```

两个守卫均由 `createBaseBackendApp()` 自动注册为全局 `APP_GUARD`，执行顺序由注册顺序决定。

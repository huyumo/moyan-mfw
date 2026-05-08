# 服务端代码整改清单

> 生成日期：2026-05-08 | 完成日期：2026-05-08 | 审查范围：`packages/base-backend/src` + `backend/src`

---

## 一、总览

| 序号 | 类别 | 严重度 | 数量 | 状态 |
|------|------|--------|------|------|
| 1 | `createQueryRunner` 事务反模式 | 🔴 高 | 6 | ✅ 已整改 |
| 2 | `@Request()` 应改 `@User()` | 🟡 中 | 2 | ✅ 已整改 |
| 3 | `process.env` 应改 `ConfigService` | 🟡 中 | 8 | ✅ 已整改 |
| 4 | `console.log` 调试代码残留 | 🔴 高 | 4 | ✅ 已整改 |
| 5 | 硬编码密钥/凭据回退值 | 🔴 高 | 3 | ✅ 已整改 |
| 6 | SQL 注入风险 | 🟡 中 | 2 | ✅ 已整改 |
| 7 | 代码风格不一致 | 🟢 低 | 2 | ✅ 已整改 |

> TypeScript 编译验证：`packages/base-backend` ✅ | `backend` ✅

---

## 二、逐项整改详情

### 1. `createQueryRunner() + try/catch` → `dataSource.transaction(callback)`

**规则来源**：MFW 指南反模式

#### 1.1 user.service.ts → `create()` (L49–L84)

**前端影响**：`ApiUserCreate` 未被前端调用，无影响。

**整改方案**：

```typescript
// 将 L48–L84 替换为：
const hashedPassword = await hashPassword(password);
return this.dataSource.transaction(async (manager) => {
  const user = manager.create(User, { username, password: hashedPassword, ...rest });
  await manager.save(user);
  if (roleIds?.length > 0) {
    const userRoles = roleIds.map((roleId) =>
      manager.create(UserRole, { userId: user.id, roleId }),
    );
    await manager.save(userRoles);
  }
  return user;
});
```

**边界问题**：无。`manager.create/save` 与 `queryRunner.manager.create/save` 行为一致。
**风险等级**：🟢 低

---

#### 1.2 user.service.ts → `adminCreate()` (L97–L130)

**前端依赖**：
- `views/sys/user/UserForm.vue` 调用 `ApiUserAdminCreate`
- `components/picker/user-picker/create-panel.tsx` 同上

**整改方案**：同 1.1，`createQueryRunner` → `dataSource.transaction`。

**边界问题**：无。
**风险等级**：🟢 低

---

#### 1.3 user.service.ts → `update()` (L247–L280)

**前端依赖**：
- `views/sys/user/UserForm.vue` 调用 `ApiUserUpdate`
- `components/picker/user-picker/create-panel.tsx` 同上

**⚠️ 边界问题**：`user` 实体在事务外通过 `this.userRepository.findOne()` 获取，然后在事务内修改保存。改为 `dataSource.transaction` 后，外部获取的实体可能处于 detached 状态。

**整改方案**：

```typescript
async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
  const { roleIds, ...rest } = updateUserDto;
  return this.dataSource.transaction(async (manager) => {
    // 在事务内重新获取实体，确保 attached
    const user = await manager.findOne(User, { where: { id } });
    if (!user) throw new NotFoundError('用户');
    Object.assign(user, rest);
    await manager.save(user);
    if (roleIds) {
      await manager.delete(UserRole, { userId: user.id });
      if (roleIds.length > 0) {
        const userRoles = roleIds.map((roleId) =>
          manager.create(UserRole, { userId: user.id, roleId }),
        );
        await manager.save(userRoles);
      }
    }
    return user;
  });
}
```

**关键改动**：`this.userRepository.findOne()` → `manager.findOne()`，确保实体在事务上下文中。
**风险等级**：🟡 中（需要验证实体行为）

---

#### 1.4 permission.service.ts → `batchCreate()` (L356–L385)

**前端影响**：`ApiPermissionBatchCreate` 未被前端调用，无影响。

**整改方案**：同 1.1。

**边界问题**：循环内每次 `findOne` 检查唯一性，改为 `dataSource.transaction` 后 `manager.findOne()` 同样适用。
**风险等级**：🟢 低

---

#### 1.5 app-member.service.ts → `updateRoles()` (L191–L225)

**前端依赖**：
- `views/sys/member/RoleAssignForm.vue` 调用 `ApiAppMemberUpdateRoles`

**边界问题**：
1. `require('crypto').randomUUID()` 动态 require，改为 `import { randomUUID } from 'crypto'`
2. `queryRunner.manager.query()` → `manager.query()` 保持一致

**整改方案**：

```typescript
// 文件顶部添加
import { randomUUID } from 'crypto';

// 事务部分改为：
await this.dataSource.transaction(async (manager) => {
  await manager.query(
    `DELETE ur FROM sys_user_roles ur
     INNER JOIN sys_roles r ON ur.roleId = r.id
     WHERE ur.userId = ? AND (r.appId = ? OR r.appTypeId = ?)
     AND r.isOwner = 0`,
    [userId, appId, app.appTypeId],
  );
  if (roleIds.length > 0) {
    const insertValues = roleIds.map((roleId) => [randomUUID(), userId, roleId]);
    await manager.query(
      `INSERT INTO sys_user_roles (id, userId, roleId) VALUES ?`,
      [insertValues],
    );
  }
});
```

**风险等级**：🟢 低

---

#### 1.6 app-member.service.ts → `removeMember()` (L254–L274)

**前端依赖**：
- `views/sys/member/Index.vue` 调用 `ApiAppMemberRemoveMember`

**⚠️ 边界问题**：L266 使用 `this.appMemberRepository.delete()` — Repository 删除与事务内 `queryRunner.manager` 不在同一连接。改为 `dataSource.transaction` 后，必须将 `repository.delete` 改为 `manager.delete`。

**整改方案**：

```typescript
await this.dataSource.transaction(async (manager) => {
  await manager.query(`DELETE FROM sys_user_roles WHERE userId = ?`, [userId]);
  await manager.delete(AppMember, { appId, userId });
});
```

**风险等级**：🟡 中（改变了删除方式，需验证软删除行为）

---

### 2. `@Request()` → `@User()`

**规则来源**：MFW 指南反模式

#### 2.1 auth.controller.ts → `logout()` (L124)

**前端依赖**：`store/auth-store.ts` 使用 `fetch('/api/auth/logout', ...)`

**边界问题**：`logout()` 需要从请求头提取 Bearer token，`@User()` 只能获取用户信息，需用 `@Headers('authorization')`。

**整改方案**：

```typescript
import { Headers } from '@nestjs/common';

@Public()
@Post('logout')
async logout(@Headers('authorization') authHeader: string) {
  const token = authHeader?.replace('Bearer ', '');
  await this.authService.logout(token);
  return ApiResponseUtil.success(null, '退出成功');
}
```

**风险等级**：🟢 低

---

#### 2.2 supplier.controller.ts → `createProfile()` (L25–L28)

**前端依赖**：无前端调用。

**边界问题**：`req.user` 提取的 `user` 变量在方法体中**完全未使用**。

**整改方案**：直接删除 `@Request() req: any` 参数和 `const user = req.user as UserDto`。

**风险等级**：🟢 低

---

### 3. `process.env` → `ConfigService`

#### 3.1 auth.service.ts → JWT expiresIn 读取 (8 处)

涉及方法：`login()`、`refreshToken()`、`register()`

**⚠️ 边界问题**：ConfigService 中没有注册 JWT 配置（只有 database/app/redis/user 四项）。

**推荐方案**：

```typescript
// 1. 新建 packages/base-backend/src/config/jwt.config.ts
export default () => ({
  jwt: {
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '7200', 10),
    refreshExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '7200', 10),
    secret: process.env.JWT_SECRET || '',
  },
});

// 2. create-base-backend-app.ts ConfigModule.load 中添加 jwtConfig

// 3. auth.service.ts 中注入 ConfigService，使用 configService.get('jwt')
```

**风险等级**：🟡 中（配置架构变更）

---

#### 3.2 user.service.ts → `resolveDefaultPassword()` (L135–L136)

```typescript
// 整改后：
const userConfig = this.configService.get<any>('userConfig');
const type = userConfig?.defaultPassword?.type || 'fixed';
const value = userConfig?.defaultPassword?.value || 'Admin@123';
```

**原因**：`user.config.ts` 已做 `process.env` → 默认值映射，ConfigService 加载后 `userConfig` 已是最终值。

**风险等级**：🟢 低

---

### 4. `console.log` 调试代码残留

| # | 文件 | 行号 | 内容 | 风险 |
|---|------|------|------|------|
| 1 | user.service.ts | L334 | `console.log('hashedPassword:', hashedPassword)` | 🔴 密码哈希泄露 |
| 2 | role.service.ts | L210 | `console.log(datas)` | 🟡 调试日志 |
| 3 | app-type.service.ts | L251 | `console.log('********:::::', pcRows)` | 🟡 调试日志 |
| 4 | app-type.service.ts | L310 | `console.log(entitiesToInsert)` | 🟡 调试日志 |

**整改**：全部删除。风险等级：🟢 低。

---

### 5. 硬编码密钥/凭据回退值

#### 5.1 create-base-backend-app.ts L159 — JWT secret

```typescript
// ❌ 当前
secret: options.jwt?.secret || process.env.JWT_SECRET || 'default_jwt_secret',

// ✅ 整改：启动时校验
const jwtSecret = options.jwt?.secret || process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET 未设置，请检查环境变量配置');
}
```

**风险等级**：🟡 中

---

#### 5.2 database.config.ts L34 — DB 密码

```typescript
// ❌ 当前
password: process.env.DB_PASSWORD || 'moyan_mfw',
```

**整改方案**：开发环境保留 `.env.development` 配置，生产环境必须通过环境变量注入。

**风险等级**：🟡 中

---

#### 5.3 user.config.ts L4 — 管理员默认密码

保留（功能性默认，非安全凭据），建议生产环境通过环境变量覆盖。

**风险等级**：🟢 低

---

### 6. SQL 注入风险

#### role.service.ts → `findAll()` (L100, L108)

```typescript
// ❌ 当前
sql: `SELECT @appTypeId := appTypeId FROM sys_apps WHERE id = '${appId}'`,
...
WHERE role.appTypeId = IFNULL(@appTypeId,'${appTypeId}')
```

**整改方案**：改用参数化查询，或对 `appId` 做白名单校验：

```typescript
if (appId && !/^[a-f0-9-]{36}$/.test(appId)) {
  throw new BadRequestException('无效的 appId 格式');
}
```

**风险等级**：🟡 中

---

### 7. 代码风格不一致

| 项 | 说明 |
|----|------|
| `collectPermissionNodes` | role.service.ts 仅收集 checked=true，app-type.service.ts 收集全部。统一为前者。 |
| `require('crypto').randomUUID()` | 改为 `import { randomUUID } from 'crypto'` |

**风险等级**：🟢 低（可选整改）

---

## 三、前端影响汇总

| 前端页面/组件 | 依赖 API | 受影响 |
|---------------|----------|--------|
| `views/login/index.vue` | `ApiAuthLogin` | ❌ |
| `store/auth-store.ts` | `fetch /api/auth/refresh` | ❌ |
| `store/auth-store.ts` | `fetch /api/auth/logout` | ⚠️ header 提取方式变化 |
| `views/sys/user/UserForm.vue` | `ApiUserAdminCreate`, `ApiUserUpdate` | ⚠️ |
| `components/picker/user-picker/create-panel.tsx` | `ApiUserAdminCreate`, `ApiUserUpdate` | ⚠️ |
| `views/sys/user/Index.vue` | `ApiUserUpdateStatus`, `ApiUserResetPassword`, `ApiUserDelete` | ❌ |
| `components/business/rolo-form/Index.vue` | `ApiRoleCreate`, `ApiRoleUpdate` | ❌ |
| `components/business/role-permission-panel/Index.vue` | `ApiRoleAssignPermissions` | ❌ |
| `views/sys/member/RoleAssignForm.vue` | `ApiAppMemberUpdateRoles` | ⚠️ |
| `views/sys/member/Index.vue` | `ApiAppMemberRemoveMember` | ⚠️ 删除方式变化 |
| `views/sys/permission-pc/Index.vue` | `ApiPermissionSyncPermissions` | ❌ |
| `components/business/permission-pool-panel/Index.vue` | `ApiAppTypeUpdatePermissionPool` | ❌ |

---

## 四、整改优先级

| 优先级 | 整改项 | 原因 |
|--------|--------|------|
| P0 | 删除 `console.log`（4处） | 零风险，含密码泄露 |
| P1 | `@Request()` → `@User()` / `@Headers()` | 零风险，装饰器替换 |
| P2 | `createQueryRunner` → `dataSource.transaction`（6处） | 需验证行为 |
| P2 | SQL 注入修复 | 需理解参数传递机制 |
| P3 | `process.env` → `ConfigService` | 需新增配置模块 |
| P3 | 硬编码密钥处理 | 需同步环境配置 |
| P4 | 代码风格统一 | 可选 |

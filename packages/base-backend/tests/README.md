# 测试环境说明

> **最后更新**: 2026-04-01
> **测试框架**: Jest + Supertest

---

## 目录结构

```
packages/base-backend/
├── tests/
│   ├── setup/              # 测试设置和工具
│   │   ├── index.ts        # 导出所有测试工具
│   │   ├── jest.setup.ts   # Jest 全局设置
│   │   ├── test-db.config.ts    # 测试数据库配置
│   │   ├── test-app.factory.ts  # 测试应用工厂
│   │   └── test-utils.ts   # 测试工具函数
│   ├── integration/        # 集成测试用例
│   │   ├── auth-api.spec.ts    # 认证模块测试
│   │   └── user-api.spec.ts    # 用户模块测试
│   └── e2e/              # E2E 测试（待添加）
├── jest.config.ts        # Jest 配置
├── tsconfig.test.json    # 测试 TypeScript 配置
├── .env.test            # 测试环境变量
└── package.json         # 测试脚本
```

---

## 测试环境配置

### 1. 环境变量

测试环境使用独立的配置文件 `.env.test`：

```bash
# 复制并修改配置
cp .env.test.example .env.test
```

### 2. 测试数据库

测试使用独立的数据库，避免污染开发/生产数据：

```sql
-- 创建测试数据库
CREATE DATABASE IF NOT EXISTS test_moyan_mfw;
```

### 3. 运行测试

```bash
# 运行所有测试
pnpm test

# 运行集成测试
pnpm test:integration

# 运行特定模块测试
pnpm test:integration:auth
pnpm test:integration:user

# 监听模式（开发用）
pnpm test:watch

# 生成覆盖率报告
pnpm test:cov
```

---

## 测试用例说明

### AUTH 模块测试 (auth-api.spec.ts)

| 测试组 | 场景数 | 说明 |
|--------|--------|------|
| AUTH-01 | 4 | 用户登录测试 |
| AUTH-02 | 3 | 刷新 Token 测试 |
| AUTH-03 | 3 | 获取用户信息测试 |
| AUTH-04 | 2 | 退出登录测试 |

### USER 模块测试 (user-api.spec.ts)

| 测试组 | 场景数 | 说明 |
|--------|--------|------|
| USER-01 | 5 | 创建用户测试 |
| USER-02 | 5 | 查询用户列表测试 |
| USER-03 | 3 | 查询用户详情测试 |
| USER-04 | 3 | 更新用户测试 |
| USER-05 | 3 | 删除用户测试 |
| USER-06 | 3 | 更新用户状态测试 |
| USER-07 | 2 | 重置密码测试 |

---

## 默认测试账号

| 账号 | 密码 | 角色 | 权限 |
|------|------|------|------|
| `admin` | `Admin@123` | 超级管理员 | 所有权限 |
| `test` | `Test@123` | 普通用户 | 仅查看权限 |

---

## 测试工具函数

### createTestApp()

创建测试用的 NestJS 应用实例：

```typescript
import { createTestApp } from './tests/setup';

const app = await createTestApp({
  useGlobalPrefix: true,
  useGlobalFilters: true,
  useGlobalInterceptors: true,
  useGlobalPipes: true,
});
```

### login()

登录并获取 Token：

```typescript
import { login } from './tests/setup';

const { token, refreshToken, user } = await login(app, 'admin', 'Admin@123');
```

### authenticatedRequest()

创建带认证的请求：

```typescript
import { authenticatedRequest } from './tests/setup';

const response = await authenticatedRequest(app, token)
  .get('/api/users')
  .expect(200);
```

### generateUniqueIdentifier()

生成唯一的测试标识符：

```typescript
import { generateUniqueIdentifier } from './tests/setup';

const uniqueUsername = generateUniqueIdentifier('testuser');
// 输出：testuser_1712000000000_abc123
```

---

## 测试断言示例

### 响应结构断言

```typescript
expect(response.body.code).toBe(0);
expect(response.body.data).toBeDefined();
expect(response.body.data.id).toBeDefined();
```

### 错误响应断言

```typescript
expect(response.body.code).toBe(40001);
expect(response.body.message).toContain('错误');
```

### 分页数据断言

```typescript
expect(response.body.data.list).toBeDefined();
expect(Array.isArray(response.body.data.list)).toBe(true);
expect(response.body.data.total).toBeGreaterThanOrEqual(1);
```

---

## 覆盖率要求

| 指标 | 要求 |
|------|------|
| 分支覆盖率 | ≥ 70% |
| 函数覆盖率 | ≥ 70% |
| 行覆盖率 | ≥ 70% |
| 语句覆盖率 | ≥ 70% |

---

## 常见问题

### Q: 测试失败 "Cannot connect to database"

**A**: 检查 `.env.test` 中的数据库配置，确保测试数据库已创建且可访问。

### Q: 测试失败 "Port 3001 already in use"

**A**: 测试使用端口 3001，确保没有其他服务占用。

### Q: 如何调试测试？

**A**: 使用 `console.log()` 或在 VS Code 中配置 Jest 调试器：

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug Test",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "cwd": "${workspaceFolder}/packages/base-backend"
}
```

---

## 待办事项

- [ ] 添加角色模块测试 (role-api.spec.ts)
- [ ] 添加权限模块测试 (permission-api.spec.ts)
- [ ] 添加应用类型模块测试 (app-type-api.spec.ts)
- [ ] 添加应用实例模块测试 (app-api.spec.ts)
- [ ] 添加审计日志模块测试 (audit-log-api.spec.ts)
- [ ] 添加 E2E 测试配置

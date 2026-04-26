---
version: "1.0"
last_updated: "2026-04-25"
scope: infra
triggers:
  - 部署
  - Docker
  - 数据库
  - 健康检查
  - Git 工作流
  - 测试
  - 集成测试
dependencies: []
maturity: stable
tags: [部署, Docker, 数据库, Git, 测试, 健康检查, JWT]
---

# 部署、Git 与测试

## 部署要点

- Docker Compose：mysql:8.0 + redis:7-alpine + app:node:20-alpine
- 数据库：moyan_mfw / moyan / moyan123456
- 种子数据顺序：应用类型 → admin 用户 → 权限树 → 超级管理员角色 → 应用实例 → 权限池 → 角色权限 → 拥有者绑定
- 健康检查：`/api/health` / `/api/health/ready` / `/api/health/live`
- **JWT Secret 硬编码为测试值，生产部署必须修改**

## Git 工作流

### 分支命名

| 类型 | 格式 | 示例 |
|------|------|------|
| 功能 | `feature/简述` | `feature/order-management` |
| 修复 | `fix/简述` | `fix/permission-check` |
| 文档 | `docs/简述` | `docs/api-documentation` |

### 提交信息格式

```
<type>(<scope>): <subject>

<body>
```

type 类型：feat / fix / docs / style / refactor / test / chore

## 后端集成测试

位置：`packages/base-backend/tests/integration/`

每个模块对应一个 `xxx-api.spec.ts`，使用 supertest + Jest：

```typescript
describe('UserController (e2e)', () => {
  it('/users (POST) - should create user', () => {
    return request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send(createUserDto)
      .expect(201);
  });
});
```

运行：`cd packages/base-backend ; pnpm run test:e2e`

## 前端单元测试

位置：`packages/base-frontend/src/components/**/__tests__/`

使用 vitest + @vue/test-utils + jsdom

运行：`cd packages/base-frontend ; pnpm run test:unit`

## 前后端联动数据流

### 完整列表页数据流

```
1. 用户访问 /sys/user
2. 路由守卫 → 检查 Token → initializeAuth → 加载权限菜单
3. MfwListPage 组件挂载 → 调用 loadData()
4. loadData → new ApiUserFindAll({ query }) → moyan-api Axios → HTTP GET /api/users
5. 后端 AuthGuard → PermissionGuard → UserController.findAll
6. UserService.findAll → PaginationX + WhereBuilder → 原生 SQL → MySQL
7. 响应 → TransformInterceptor → { code, data: { list, total }, message }
8. 前端接分页数据 → MfwListPage 渲染表格
```

### 完整表单操作数据流

```
1. 用户点击"新建" → MfwPopup.open({ component: XxxForm })
2. XxxForm 表单提交 → new ApiXxxCreate({ body }) → HTTP POST /api/xxx
3. 后端 → ValidationPipe 校验 → Controller.create → Service.create → 事务写入
4. 响应 → 前端回调 listPage.refresh() → 重新加载列表
```

## 反模式（Red Flags）— 立即停止

- ✋ JWT Secret 使用默认测试值部署到生产 → 必须修改为强随机密钥
- ✋ 跳过种子数据直接使用系统 → 初始化顺序有依赖，必须按序执行
- ✋ 数据库迁移未备份就执行 → 生产环境迁移前必须备份
- ✋ Docker 容器未配置健康检查 → 使用 `/api/health/ready` 和 `/api/health/live`

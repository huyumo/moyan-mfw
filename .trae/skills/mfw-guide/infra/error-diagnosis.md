---
version: "1.0"
last_updated: "2026-04-26"
scope: infra
triggers:
  - "错误排查"
  - "构建失败"
  - "启动失败"
  - "401"
  - "403"
  - "数据库连接"
  - "API 生成失败"
dependencies: ["auth/permission-debugging", "infra/deployment"]
maturity: stable
tags: [错误排查, 构建失败, 401, 403, 数据库, API生成, 前端, 后端]
---

# 错误诊断

## 数据库连接失败

```
TypeORM connection refused / ECONNREFUSED / connect timeout
```

1. MySQL 服务是否运行？ → `docker ps` 或 `mysql -u root -p`
2. 连接配置是否正确？ → 检查 `.env` 或 `config/database.ts`
3. 端口是否被占用？ → `netstat -ano | findstr 3306`
4. Docker 容器是否健康？ → `docker logs <container>`
5. 数据库是否已创建？ → `CREATE DATABASE moyan_mfw;`

## 后端启动失败

```
NestFactory.create() error / Module import error
```

1. 依赖是否安装？ → `pnpm install`
2. TypeScript 编译是否通过？ → `pnpm run build`
3. 端口是否被占用？ → `netstat -ano | findstr 3000`
4. 环境变量是否设置？ → 检查 `.env` 文件
5. Entity 是否在 `app.module.ts` 的 `entities` 数组中注册？

## 前端构建错误

```
Vite build error / TypeScript type error
```

1. 依赖是否安装？ → `pnpm install`
2. 类型是否同步？ → `pnpm run typecheck:vue`
3. APIs 是否最新？ → `pnpm run api:build`（需后端运行）
4. 导入路径是否正确？ → 检查相对路径 `../../../`
5. 组件是否正确导出？ → 检查 `mod.ts` 和 `index.ts`

## API 生成失败（pnpm run api:build）

```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

1. 后端是否运行？ → `pnpm run dev:backend` 或确保 3000 端口服务可用
2. Swagger 文档是否可访问？ → 浏览器打开 `http://localhost:3000/api-docs`
3. 后端 Controller 是否有 `@ApiTags`？ → 没有 `@ApiTags` 的 Controller 不会被 Swagger 文档收录
4. moyan-api 配置是否正确？ → 检查 `api.build.cjs` 中的 `jsonurl` 和 `output`

## 路由/菜单问题

### 页面 404

1. `views/` 目录下是否有对应的页面目录？ → 路由基于 `views/` 自动扫描
2. 页面目录是否有 `index.ts`？ → 没有 `index.ts` 则不会被扫描注册
3. `index.ts` 是否导出 `definePageConfig`？ → 必须有 `export default definePageConfig({...})`
4. 浏览器控制台是否有路由注册警告？

### 菜单不显示

1. 用户是否有该页面的权限？ → 详见 {{ref:auth/permission-debugging}} — 菜单不显示排查
2. `definePageConfig` 中 `auth` 是否设为 `true`？
3. `defineModuleConfig` 是否存在？ → 模块配置文件控制菜单分组
4. `order` 字段是否导致排序到不可见位置？

### 权限问题

→ 详见 {{ref:auth/permission-debugging}} — 完整认证链路排查

## 常见运行时错误

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `Cannot find module` | 导入路径错误或依赖未安装 | 检查路径、运行 `pnpm install` |
| `Entity metadata not found` | Entity 未注册到 TypeORM | 在 `app.module.ts` 的 entities 数组中添加 |
| `Circular dependency` | 模块间循环引用 | 使用 `forwardRef()` 或重构模块边界 |
| `Token expired` | JWT 过期 | 检查刷新机制，确认 10 分钟内自动刷新逻辑 |
| `QueryFailedError` | SQL 执行失败 | 检查 SQL 语法、表名、字段名 |
| `Validation failed` | DTO 校验失败 | 检查请求 body 是否符合 DTO 定义 |

## 诊断决策树

### 症状：接口返回 401

**假设 1**：Token 过期
→ 验证：打开 DevTools → Application → localStorage → 检查 `mfw:admin:token` 是否存在及过期时间
→ 修复：清除 Token 重新登录，检查 10 分钟自动刷新逻辑是否正常

**假设 2**：Token 缺失
→ 验证：检查 localStorage 中是否有 `mfw:admin:token`
→ 修复：确认登录流程是否正确存储 Token，检查 `tokenManager` 调用

**假设 3**：后端 JWT Secret 变更
→ 验证：检查后端 `.env` 中 `JWT_SECRET` 配置是否与之前一致
→ 修复：同步 JWT Secret 后重新登录

### 症状：接口返回 403

**假设 1**：用户未被分配权限
→ 验证：检查 `sys_role_permission` 表中该角色是否有对应 `permission_code`
→ 修复：通过管理界面分配权限 → 详见 {{ref:auth/permission-debugging}}

**假设 2**：权限池未配置
→ 验证：检查 `permissions.ts` 中是否定义了 `pc_root:sys:xxx` 编码
→ 修复：添加权限编码并重新运行后端

**假设 3**：permissionValue 不匹配
→ 验证：对比 Controller `@RequirePermission` 值与 `permissions.ts` 中的编码
→ 修复：统一权限编码命名

### 症状：菜单不显示

**假设 1**：权限菜单未加载
→ 验证：DevTools Network → 检查 `/api/sys/menu/user` 接口返回是否包含目标菜单
→ 修复：→ 详见 {{ref:auth/permission-debugging}} — 菜单不显示排查

**假设 2**：definePageConfig 缺失或配置错误
→ 验证：检查页面 `index.ts` 中 `definePageConfig` 的 `auth` 是否为 `true`
→ 修复：添加 `auth: true` 配置

**假设 3**：order 排序问题
→ 验证：检查 `defineModuleConfig` 中 `order` 是否将菜单排到不可见位置
→ 修复：调整 order 值

### 症状：前端构建类型错误

**假设 1**：APIs 未同步
→ 验证：运行 `pnpm run api:build`，确认后端先运行
→ 修复：重新生成 APIs

**假设 2**：导入路径错误
→ 验证：检查 TypeScript 报错中的导入路径是否存在
→ 修复：修正相对路径或确认文件已创建

**假设 3**：组件未导出
→ 验证：检查组件的 `mod.ts` 和 `components/index.ts` 是否正确导出
→ 修复：添加导出声明

### 症状：API 生成失败

**假设 1**：后端未运行
→ 验证：`curl http://localhost:3000/api-docs-json` 是否返回 JSON
→ 修复：先启动后端 `pnpm run dev:backend`

**假设 2**：Swagger 不可达
→ 验证：浏览器打开 `http://localhost:3000/api-docs` 是否显示文档
→ 修复：检查 SwaggerModule 配置

**假设 3**：Controller 缺少 @ApiTags
→ 验证：检查所有 Controller 是否有 `@ApiTags('xxx')` 装饰器
→ 修复：添加 `@ApiTags` 装饰器

### 症状：数据库连接失败

**假设 1**：MySQL 未运行
→ 验证：`docker ps` 查看容器状态，或 `mysql -u root -p` 测试连接
→ 修复：`docker start <container>` 或启动 MySQL 服务

**假设 2**：配置错误
→ 验证：检查 `.env` 中 `DB_HOST`、`DB_PORT`、`DB_USERNAME`、`DB_PASSWORD`、`DB_DATABASE`
→ 修复：修正配置值

**假设 3**：端口占用
→ 验证：`netstat -ano | findstr 3306` 检查端口使用情况
→ 修复：停止占用进程或更换端口

## 反模式（Red Flags）— 立即停止

- ✋ 遇到错误不读日志直接重启 → 先读错误信息再操作
- ✋ 生产环境直接清库重建 → 使用 migration 管理，不清库
- ✋ 忽略 TypeScript 类型错误 → 类型错误意味着运行时可能出错
- ✋ 手动修改 `apis/` 目录修复前端报错 → 修改后端后重新生成
- ✋ 遇到 403 直接给用户开发者权限 → 排查权限配置，不绕过安全机制

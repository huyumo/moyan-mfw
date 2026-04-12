# CLAUDE - 最高指导文件

> 状态：**强制执行** | 优先级：**最高**

---

## 铁律（不可违反）

### 0. 文档创建规范（强制执行）

**⚠️ 创建任何 `docs/` 目录下的 `.md` 文件前，必须先调用 DOC-001 智能体**

**强制流程**:
```
1. 用户请求创建/修改文档
   ↓
2. 调用 Agent(subagent_type="docs-architect") 进行规划
   ↓
3. 根据 DOC-001 的规划创建文档
   ↓
4. 文档遵循规范（存放位置、命名格式）
```

**违规后果**:
- ⛔ 未调用 DOC-001 直接创建文档 → 文档必须删除，重新执行规范流程
- ⛔ 文档存放位置错误 → 必须迁移至正确目录
- ⛔ 文档命名不规范 → 必须重命名为 `YYYY-MM-DD_主题.md` 格式

**正确示例**:
```
Agent({
  subagent_type: "docs-architect",
  prompt: "规划文档结构和存放位置：前端项目摸底测试报告"
})
```

---

### 1. 强制自测试验证（步骤 5.5）

**⚠️ 这是代码质量的最后防线，任何情况下不得跳过**

**必须执行的检查清单**：

| 序号 | 检查项 | 执行命令 | 通过标准 |
|------|--------|---------|---------|
| 1 | **单元测试** | `pnpm vitest run` | 全部通过 |
| 2 | **类型检查** | `pnpm typecheck` | 无错误 |
| 3 | **项目启动** | `pnpm dev` + `pnpm start:dev` | 服务正常 |
| 4 | **功能验证** | 手动测试 | 核心功能正常 |

**违规后果**：
- ⛔ 跳过自测试 → 立即停止工作，强制退回
- ⛔ 虚假报告 → 记录违规，重新执行
- ⛔ 测试失败仍提交 → 拒绝提交，强制回滚

**交付标准话术**：
```
开发完成。自测试验证结果：
- 单元测试：X/X 通过 ✅
- 类型检查：无错误 ✅
- 项目启动：后端 http://localhost:3000，前端 http://localhost:XXXX ✅
- 功能验证：核心功能正常 ✅
请验收。
```

---

## 工作流程

### 会话开始时
1. 读取 `TASK.md`
2. 确认任务状态
3. 记录会话目标

### 任务执行中
4. 按规范开发
5. 边开发边自测

### 任务完成后（强制）
6. **自我反思**（反向验证）
7. **⚠️ 强制自测试验证**（步骤 5.5，权重最高）
8. 任务归档
9. Git 提交

---

## 参考规则

- [会话流程规则](.claude/rules/core/01-session-flow.md)
- [任务管理规则](.claude/rules/core/02-task-management.md)
- [记忆保存规则](.claude/rules/core/03-memory-rules.md)

---

**更新日期**：2026-04-03  
**维护者**：@ai + @user

---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

### Development

```bash
# Start frontend dev server (examples app)
pnpm dev:examples

# Start backend dev server
cd packages/base-backend && pnpm start:dev

# Start business frontend dev server
pnpm dev:frontend
```

### Testing

```bash
# Backend unit/integration tests
cd packages/base-backend && pnpm test

# Backend integration tests (auth)
cd packages/base-backend && pnpm test:integration:auth

# Frontend unit tests
cd packages/base-frontend && pnpm run test:unit

# E2E tests (Playwright)
pnpm playwright:test
```

### Code Quality

```bash
# Lint all packages
pnpm lint

# Fix lint issues
pnpm lint:fix

# Format code
pnpm format

# Type check (Vue + scripts)
pnpm typecheck
pnpm typecheck:scripts
```

### Database

```bash
cd packages/base-backend

# Generate migration
pnpm migration:generate -- src/database/migrations/NewMigration

# Run migrations
pnpm migration:run

# Rollback migration
pnpm migration:revert

# Show migration status
pnpm migration:show

# Seed database
pnpm seed:run
```

---

## Architecture

### Monorepo Structure (pnpm workspaces)

```
moyan-mfw/
├── packages/
│   ├── base-frontend/     # Reusable admin UI components (Vue 3 + Element Plus)
│   └── base-backend/      # NestJS backend with RBAC (MySQL + Redis)
├── frontend/              # Business frontend application
├── examples/              # Example/demo frontend app
├── backend/               # (Legacy - base-backend is the active backend)
├── docs/                  # VitePress documentation
└── tests/e2e/             # Playwright E2E tests
```

### Backend Architecture (NestJS)

```
packages/base-backend/src/
├── main.ts                # App entry: global filters, interceptors, Swagger
├── app.module.ts          # Root module
├── common/                # Shared utilities
│   ├── entities/          # BaseEntity (id, createdAt, updatedAt)
│   ├── filters/           # AllExceptionsFilter
│   ├── guards/            # AuthGuard, permission guards
│   ├── interceptors/      # Logging, Transform, Audit
│   ├── decorators/        # @Public, @AuditLog, @RequirePermission
│   ├── utils/             # Encryption, pagination, query builder
│   └── types/             # API response types
├── modules/sys/           # System modules (RBAC core)
│   ├── auth/              # JWT authentication, login/refresh
│   ├── user/              # User CRUD
│   ├── role/              # Role management
│   ├── permission/        # Permission sync, PC permissions
│   ├── app-type/          # Application type management
│   ├── app/               # Application + AppMember
│   ├── member/            # Member management
│   └── audit-log/         # Operation audit logs
├── modules/health/        # Health check endpoint
├── config/                # AppConfig, Redis config
└── database/              # TypeORM migrations, seeds, data-source
```

**Core Backend Features:**
- JWT authentication with refresh tokens
- RBAC permission model (user → role → permission)
- Audit logging with data snapshots
- Swagger API docs at `/api-docs`
- Global exception filter + response transform

### Frontend Architecture (Vue 3)

```
packages/base-frontend/src/
├── index.ts               # Package entry
├── create-base-admin-app.ts  # App factory
├── apis/                  # API client (axios-based)
├── components/            # Reusable components
│   ├── display/           # MfwFormat (date/image/dict/tag formatters)
│   ├── editor/            # JSON editor, rich text
│   ├── feedback/          # Popup, loading
│   ├── form/              # FormCard
│   ├── table/             # TableList
│   ├── page/              # PageScene
│   └── picker/            # IconPicker, UserPicker, AppSelector
├── layouts/               # Admin layouts (dual/head/tail modes)
├── router/                # Base routes + menu-tree + guard
├── store/                 # Pinia stores (auth, layout)
├── types/                 # TypeScript types
└── utils/                 # Permission helpers
```

**Core Frontend Features:**
- Layout system (dual/header/tail modes, tabs support)
- Theme system with color schemes
- Permission-based route/menu generation
- Reusable business components
- API client with auth handling

### Auth Flow

1. User logs in → JWT token stored
2. Token attached to API requests via interceptor
3. Backend AuthGuard validates token
4. Permission guard checks user permissions
5. Audit interceptor logs operations

---

## Development Conventions

### Code Style

- **TypeScript**: Strict mode, ES2022 target
- **Vue**: Composition API with `<script setup>`
- **Naming**: Components use `Mfw` prefix (e.g., `MfwDateFormat`)
- **Comments**: JSDoc required for public APIs (enforced by ESLint)

### Git Workflow

- Branch naming: `feature/xxx`, `fix/xxx`, `docs/xxx`
- Commits follow Conventional Commits format
- PRs require code review before merge

### Testing Strategy

| Layer | Tool | Location |
|-------|------|----------|
| Unit (backend) | Jest | `packages/base-backend/tests/unit/` |
| Integration (backend) | Jest + TypeORM | `packages/base-backend/tests/integration/` |
| Unit (frontend) | Vitest | `packages/base-frontend/src/**/__tests__/` |
| E2E | Playwright | `tests/e2e/` |

---

## Documentation

- **Product docs**: `docs/` directory (VitePress)
- **API docs**: `http://localhost:3000/api-docs` (Swagger)
- **Team docs**: `docs/02-团队/` (team charter, review templates)

---

## Environment Setup

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- MySQL 8.0+
- Redis 7.x

### Quick Start

```bash
# Install dependencies
pnpm install

# Backend: copy and configure .env
cd packages/base-backend && cp .env.example .env

# Start backend
cd packages/base-backend && pnpm start:dev

# Start frontend (new terminal)
pnpm dev:examples
```

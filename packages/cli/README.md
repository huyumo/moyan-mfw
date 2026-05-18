# moyan-mfw-cli

MFW (墨焱管理框架) 脚手架 CLI 工具，提供扩展插件和业务项目的快速生成功能。

## 安装

```bash
# 全局安装
npm install -g moyan-mfw-cli

# 或通过 pnpm
pnpm add -g moyan-mfw-cli
```

**环境要求**：Node.js >= 20.0.0

## 命令速查

| 命令 | 说明 |
|------|------|
| `mfw create extension <name>` | 创建扩展插件项目 |
| `mfw create business <name>` | 创建业务项目（后端+前端+共享层） |
| `mfw generate` | 生成代码（开发中） |
| `mfw validate` | 验证扩展包（开发中） |
| `mfw version` | 版本管理（开发中） |

## 使用指南

### 创建扩展插件

扩展插件是可插拔的模块，拥有独立的 backend/frontend/shared 三层架构。

```bash
mfw create extension my-ext
```

**交互式提示**：

| 选项 | 默认值 | 说明 |
|------|--------|------|
| 显示名称 | PascalCase 转换名 | 中文/展示名称 |
| 描述 | 空 | 项目描述 |
| 路由前缀 | `/ext/{name}` | 必须以 `/ext/` 开头 |
| 需要后端模块? | 是 | 是否生成 NestJS 后端 |
| 需要前端页面? | 是 | 是否生成 Vue3 前端 |
| 需要共享层? | 是 | 是否生成 TypeScript 类型层 |

**生成目录结构**：

```
extension-my-ext/
├── src/
│   ├── backend/     → NestJS 应用
│   ├── frontend/    → Vue3 + Vite 应用
│   └── shared/      → 纯 TypeScript 类型
├── database/migrations/
└── package.json
```

**非交互模式**（跳过所有提示，使用默认值）：

```bash
mfw create extension my-ext -y
```

**后续步骤**：

```bash
cd extension-my-ext && pnpm install
pnpm dev:backend   # 启动后端
pnpm dev:frontend  # 启动前端
```

### 创建业务项目

业务项目是独立完整的应用，包含后端 API、前端界面和共享类型。

```bash
mfw create business my-shop
```

**交互式提示**：

| 选项 | 默认值 | 说明 |
|------|--------|------|
| 显示名称 | PascalCase 转换名 | 中文/展示名称 |
| 描述 | `{Name} 业务项目` | 项目描述 |
| 后端端口 | `3000` | NestJS 服务端口 |
| 前端端口 | `5173` | Vite 开发服务器端口 |

**非交互模式**（跳过所有提示，使用默认值）：

```bash
mfw create business my-shop -y
```

**生成目录结构**：

```
my-shop/
├── backend/         → NestJS 后端
│   ├── src/
│   │   ├── app-types.config.ts
│   │   ├── app.modules.ts
│   │   ├── main.ts
│   │   └── permissions.ts
│   ├── .env
│   └── package.json
├── frontend/        → Vue3 前端
│   ├── src/
│   │   ├── views/dashboard/
│   │   ├── main.ts
│   │   ├── permissions.ts
│   │   └── router.ts
│   ├── index.html
│   └── package.json
├── shared/          → 共享类型
│   ├── src/
│   │   ├── index.ts
│   │   └── permissions.ts
│   └── package.json
└── package.json
```

**后续步骤**：

```bash
cd my-shop
# 编辑 backend/.env 配置数据库连接
pnpm install && pnpm build
pnpm --filter my-shop-backend dev    # 启动后端
pnpm --filter my-shop-frontend dev   # 启动前端
```

## 已知修复

| 版本 | 修复内容 |
|------|----------|
| 0.1.0 | Vue 插值与 Handlebars 冲突修复（`v-text` 替代 `{{ }}`） |
| 0.1.0 | 权限常量命名统一（`pascalCaseUpper` helper） |
| 0.1.0 | tsconfig references 路径修正（`./*/tsconfig.json`） |
| 0.1.0 | Vite alias 前缀补全（`moyan-mfw-extension-`） |
| 0.1.0 | workspace 协议补全（`workspace:*`） |

## 相关资源

- [MFW 架构文档](../../AGENTS.md)
- [扩展开发指南](../../docs/extensions/README.md)
- [本地运行指南](../../docs/本地运行指南.md)

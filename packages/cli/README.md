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

## 模板说明

### Handlebars 模板变量

| 变量 | 示例值 | 说明 |
|------|--------|------|
| `{{name}}` | `my-ext` | kebab-case 项目名 |
| `{{displayName}}` | `MyExt` | 显示名称 |
| `{{description}}` | 用户输入 | 项目描述 |
| `{{className}}` | `MyExt` | PascalCase 类名 |
| `{{version}}` | `0.1.0` | 初始版本 |
| `{{year}}` | `2026` | 当前年份 |

### 自定义 Helpers

| Helper | 输入 | 输出 | 说明 |
|--------|------|------|------|
| `pascalCase` | `my-ext` | `MyExt` | 转 PascalCase |
| `pascalCaseUpper` | `my-ext` | `MYEXT` | 转大写 PascalCase |
| `camelCase` | `my-ext` | `myExt` | 转 camelCase |
| `snakeCase` | `my-ext` | `my_ext` | 转 snake_case |

### 模板变量示例

```hbs
<!-- 权限常量声明 -->
export const {{pascalCaseUpper name}}_PERMISSION_VALUES = [...]

<!-- 数据库名 -->
DB_NAME={{snakeCase name}}

<!-- 包名引用 -->
"moyan-mfw-extension-{{name}}": "workspace:*"
```

## 开发

```bash
# 克隆仓库后进入 CLI 目录
cd packages/cli

# 安装依赖
pnpm install

# 开发模式（watch）
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm typecheck
```

### 添加新模板

1. 在 `src/templates/` 下创建新目录
2. 编写 `.hbs` 模板文件
3. 在 `src/commands/` 添加对应命令
4. 在 `src/utils/template.ts` 注册 helpers（如需）

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

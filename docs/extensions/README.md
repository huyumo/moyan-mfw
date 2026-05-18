# MFW 扩展开发指南

> **Moyan MFW (墨焱管理框架)** 扩展开发官方文档。本指南涵盖扩展包的完整开发流程、规范与最佳实践。

## 📖 文档导航

| 文档 | 说明 | 适用场景 |
|------|------|----------|
| [编写指南](./writing-guide.md) | 10 章核心教程，从零到发布 | **首次开发必读** |
| [架构说明](./architecture.md) | 运行时加载流程与数据流 | 排查集成问题 |
| [反模式清单](./reference/anti-patterns.md) | 常见错误与正确做法 | 代码审查/自查 |

## 🚀 快速开始（3 步）

### 前置条件

- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0（推荐锁定至 pnpm@10.14.0）
- 已安装 `moyan-mfw-cli`（全局工具）

### 步骤

```bash
# 1️⃣ 安装 CLI 工具
pnpm add -g moyan-mfw-cli

# 2️⃣ 创建扩展项目
mfw create extension my-ext

# 3️⃣ 进入目录，安装依赖并启动前端开发服务器
cd extension-my-ext && pnpm install && pnpm dev:frontend
```

### 预期输出

- 步骤 2 生成完整的三段式目录结构（`src/backend/`、`src/frontend/`、`src/shared/`）
- 步骤 3 前端 dev server 启动于 `http://localhost:5173`，支持热重载

## 📁 扩展定位

MFW 扩展是框架的**插件化单元**，每个扩展独立拥有：

```
extension-xxx/
├── src/
│   ├── backend/     → NestJS 应用（@internal/xxx-backend）
│   ├── frontend/    → Vue3 + Vite 应用（@internal/xxx-frontend）
│   └── shared/      → 纯 TypeScript 类型（@internal/xxx-shared）
├── database/migrations/
```

扩展通过 `moyan-mfw-base` 的三层导出获得框架能力：

```typescript
import { createExtensionBackendApp } from 'moyan-mfw-base/backend'   // 后端启动
import { createExtensionFrontendApp } from 'moyan-mfw-base/frontend' // 前端启动
import { DictMeta, DictEntry } from 'moyan-mfw-base/shared'           // 共享工具
```

## 🔗 相关资源

- [AGENTS.md](../../AGENTS.md) — 项目整体架构说明
- [本地运行指南](../本地运行指南.md) — 从零启动业务项目
- [extension-ad 示例](../../packages/extensions/extension-ad) — 参考实现
- [moyan-mfw-base API](../../packages/base) — 框架核心包文档

## 📦 CLI 命令速查

| 命令 | 说明 |
|------|------|
| `mfw create extension <name>` | 创建新扩展插件 |
| `mfw create business <name>` | 创建新业务项目（含后端+前端+共享层） |

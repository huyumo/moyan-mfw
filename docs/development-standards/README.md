# MFW 开发规范

## 概述

本目录汇总了使用 MFW 框架进行业务开发时必须遵守的规范、约定和反模式。

## 文档导航

| 文档 | 内容 |
|------|------|
| [01-project-structure.md](./01-project-structure.md) | 项目目录结构、框架能力边界、适合的系统类型 |
| [02-coding-conventions.md](./02-coding-conventions.md) | 命名规范、注释规范、文件结构约定 |
| [03-backend-standards.md](./03-backend-standards.md) | 后端开发规范：模块结构、Controller/Service/Entity/DTO 标准 |
| [04-frontend-standards.md](./04-frontend-standards.md) | 前端开发规范：页面模板、表单弹窗、组件导出链 |
| [05-dict-guide.md](./05-dict-guide.md) | 字典定义与使用指南 |
| [06-api-design.md](./06-api-design.md) | API 设计规范、权限编码规则、apis 红线 |
| [07-anti-patterns.md](./07-anti-patterns.md) | 常见反模式汇总（后端 + 前端 + 通用） |

## 核心原则

1. **字典定义只写一次** — 前端渲染、后端注释、数据库种子三处消费同一来源
2. **API 层自动生成** — 禁止手动修改 `apis/` 目录，修改后端后运行 `pnpm run api:build`
3. **事务 + 分页 走框架工具** — `dataSource.transaction()` / `PaginationX + WhereBuilder`
4. **表单走 MfwPopup + defineExpose** — 不使用 `emit('confirm')`
5. **每文件必有 @fileoverview + @description** — 所有 `.ts` / `.vue` 文件

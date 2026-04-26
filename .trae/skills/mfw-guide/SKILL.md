---
name: "mfw-guide"
description: "Use when working on moyan-mfw project code, creating modules or pages, or encountering moyan-specific errors, permission issues, or architecture questions"
---

# Moyan MFW 开发指南

## 红线规则（违反 = 代码不可合并）

1. **禁止手动修改 `apis/` 目录** — 自动生成，手改必被覆盖，详见 {{ref:apis-redline}} — apis 目录红线规则
2. **禁止 TypeORM QueryBuilder 分页查询** — 统一使用 `PaginationX + WhereBuilder`，详见 {{ref:new-backend-module}} — 新增后端模块
3. **禁止硬编码 JWT Secret 到生产环境** — 当前为测试值，部署必须修改，详见 {{ref:deployment}} — 部署、Git 与测试

⚠️ 执行任何涉及以上领域的任务前，**MUST READ** 对应文件，禁止凭记忆编码。

## 任务路由

执行对应任务前 **MUST READ** 文件，本文件不含任何可执行编码知识：

| 你要做什么 | 加载文件 |
|-----------|---------|
| 新增后端模块 / Service / Controller / Entity | {{ref:new-backend-module}} |
| 新增前端页面 / 组件 / 表单 | {{ref:new-frontend-page}} |
| 表单弹窗 / MfwPopup / FormItemConfig / SFC 结构 | {{ref:form-reference}} |
| 排查权限 / 认证 / Token / 登录问题 | {{ref:permission-debugging}} |
| 调整样式 / 主题 / 暗色模式 / SCSS | {{ref:styling-theming}} |
| 配置路由 / 守卫 / 菜单 / 页面注册 | {{ref:routing-auth}} |
| 多租户 / 应用类型 / 应用实例 / 成员管理 | {{ref:multi-tenant}} |
| 部署 / Docker / 数据库 / 健康检查 | {{ref:deployment}} |
| 查看项目整体结构 / 框架能力边界 | {{ref:project-structure}} |
| 查阅组件 API / 属性 / 使用场景 | {{ref:component-reference}} |
| 命名规范 / 注释规范 / 编码惯例 | {{ref:coding-conventions}} |
| 分页查询 / WhereBuilder / SQL 构建 | {{ref:pagination-query}} |
| 编写测试 / 单元测试 / 集成测试 | {{ref:testing-guide}} |
| 数据库迁移 / Entity 变更 / 种子数据 | {{ref:migration-guide}} |
| 错误排查 / 构建失败 / 启动失败 / API 生成失败 | {{ref:error-diagnosis}} |

## 完成前验证（每次任务必须逐项检查）

- 后端任务：是否满足 {{ref:new-backend-module}} 的 13 项清单？
- 前端任务：是否满足 {{ref:new-frontend-page}} 的 4 项清单？
- 命名是否符合规范？详见 {{ref:coding-conventions}} — 编码规范
- 每个文件是否包含 `@fileoverview` + `@description`？
- 是否触犯了红线规则？

## 代码生成指令（plop → AI Agent）

项目提供 `pnpm gen:module` / `pnpm gen:page` / `pnpm gen:component` 命令，通过交互式 prompt 收集模块元数据后**输出结构化生成指令**，由 AI Agent 据此生成代码。

**重要**：plop 只负责参数收集和指令输出，**不直接生成文件**。AI Agent 收到指令后应：
1. 读取对应的 Skill 文档（如 {{ref:new-backend-module}}、{{ref:new-frontend-page}}）
2. 根据业务描述和实际需求设计字段/接口/表单（**不要固定模板中的 name/description/status 等字段**）
3. 按照 13 项清单 / 4 项清单生成代码
4. 自动注册模块/路由/权限
5. 运行 `pnpm run api:build` 生成前端 API

## 经验教训速查

1. `apis/` 手改必被覆盖 → 修改后端后运行 `pnpm run api:build` 重新生成
2. PowerShell 不支持 `&&` → 用 `;` 分隔命令
3. 删除操作必须 `ElMessageBox.confirm` 二次确认，`catch` 后 `return`
4. API 删除操作传 `{ hintSuccess: true }` 参数
5. 状态常量统一定义：`const STATUS = { ENABLED: 1, DISABLED: 0 } as const`
6. 前端路由自动扫描 → 页面放在 `views/` 下配置 `index.ts` 即自动注册
7. 审计拦截器当前仅输出日志，未写入 `sys_audit_logs`
8. Redis 配置已预留但业务层未使用
9. 获取用户信息用 `@User() user: UserDto` → 不要用 `@Request() req.user`

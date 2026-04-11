---
name: Harness 身份报告配置
description: 会话启动时运行身份报告 hook，报告 Agent 身份而不是用户身份
type: project
---

**配置位置**：
- 项目级：`.claude/settings.json`（VSCode 扩展可能不自动执行）
- CLAUDE.md：Session Start Flow 章节
- 快速启动：`.claude/harness/package.json` → `pnpm start`

**SessionStart Hooks**：
1. `hook:identity` - 报告技术负责人 Agent 身份、开发模式、严格模式状态
2. `hook:session-start` - 验证 TASK.md 格式和任务状态

**快速启动命令**：
```bash
cd .claude/harness && pnpm start
```

**身份报告内容**：
- 技术负责人 Agent 身份（lead 角色）
- 开发模式（团队协作模式/自主模式/独立模式）
- 严格模式状态
- 团队成员列表
- 用户角色说明（用户是项目所有者，不是技术负责人）

**原因**：
- 用户要求明确技术负责人由 AI Agent 担任，不是用户本人
- 确保每次会话开始时清晰展示当前 Agent 身份和模式状态

**如何应用**：
- VSCode 扩展可能不自动执行 `.claude/settings.json` 中的 hooks
- AI 必须在会话开始时**主动**运行 `pnpm start`
- CLAUDE.md 中已明确要求此流程

**限制**：
- VSCode 扩展的 hooks 功能可能尚未完全支持
- 需要依靠 AI 主动执行而非自动触发

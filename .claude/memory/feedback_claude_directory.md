---
name: 禁止删除.claude 目录
description: 任何情况下都不得删除或修改.claude 目录，这是致命错误
type: feedback
---

**绝对禁止的操作：**
- 不得使用 `rm -rf .claude` 或任何删除 .claude 目录的命令
- 不得删除 .claude 目录下的任何文件或子目录
- 不得修改 .claude 目录的结构

**原因：**
.claude 目录是 Claude Agent 的核心配置目录，包含：
- `memory/` — 自动记忆系统
- `team/` — 团队配置和角色定义
- `settings.json` — Claude 配置设置

**正确做法：**
- 如需创建记忆，使用记忆功能而非手动操作目录
- 清理文件时必须精确定位到具体文件名
- 误操作后立即告知用户并恢复

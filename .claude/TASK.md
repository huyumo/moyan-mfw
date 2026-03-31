---
task: 将 VitePress 命令移至 docs/package.json
status: completed
priority: P1
started: 2026-03-31
updated: 2026-03-31 11:15
session: session-20260331-000000
lock: 1743421200
assignee: @dev
---

## 当前目标
将 VitePress 相关命令从根目录 package.json 移至 docs/package.json 自主管理

## 已完成
> 上期任务周期已完成任务详见历史归档：
> - [归档文件](../docs/04-项目实施/05-任务追踪/archived/TASK-2026-03-31-1036.md)
> - [归档文件](../docs/04-项目实施/05-任务追踪/archived/TASK-2026-03-31-0933.md)

- [x] 创建 docs/package.json
- [x] 迁移 VitePress 相关依赖和脚本
- [x] 更新根目录 package.json
- [x] 更新 pnpm-workspace.yaml
- [x] 配置 vitepress.config.ts 忽略 archived 目录
- [x] 验证构建命令正常工作（pnpm --filter moyan-mfw-docs build 成功）

## 进行中
- [ ] 更新质量门禁规则（保留最近 3 条归档链接、脚本使用 .spec.ts）

## 待开始
- [ ] 提交并推送变更

## 待开始
- [ ] 提交并推送变更

## 相关文件
- [历史归档 1](../docs/04-项目实施/05-任务追踪/archived/TASK-2026-03-31-1036.md)
- [历史归档 2](../docs/04-项目实施/05-任务追踪/archived/TASK-2026-03-31-0933.md)
- `.claude/memory/feedback_quality_gates.md` - 质量门禁规则

## 变更记录
| 时间 | 变更类型 | 变更内容 | 原因 |
|------|----------|----------|------|
| 2026-03-31 10:36 | 归档重置 | TASK.md 归档并重置 | 质量门禁规则验证完成 |

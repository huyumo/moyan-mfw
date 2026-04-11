# 自主协作模式 - TASK.md 模板

```markdown
---
task: 任务名称
status: pending | in_progress | blocked | completed
priority: P0 | P1 | P2 | P3
started: YYYY-MM-DD
updated: YYYY-MM-DD HH:mm
session: 会话 ID
assignee: PM-Agent  # 自主模式下默认由 PM Agent 负责
reviewers: QA-Agent  # 审查由 QA Agent 负责
reviewStatus: pending | revision_required | approved
phase: requirement | design | development | review | delivery  # 当前阶段
---

## 当前目标

[一句话描述任务目标]

---

## 用户确认 checkpoint

### ✅ Checkpoint 1: 需求确认

**状态**：待确认 / 已确认 / 需要修改

**PM Agent 分析**：
- 核心需求：...
- 功能列表：...
- 不涉及范围：...

**用户确认**：
- [ ] 需求理解正确
- [ ] 功能列表完整
- [ ] 无额外需求

**确认日期**：YYYY-MM-DD HH:mm

---

### ✅ Checkpoint 2: 设计确认

**状态**：待确认 / 已确认 / 需要修改

**技术方案**：
- 架构设计：...
- 关键技术选型：...
- 文件影响分析：...

**任务分解**：
- [ ] 任务 1
- [ ] 任务 2
- [ ] 任务 3

**用户确认**：
- [ ] 技术方案合理
- [ ] 任务分解清晰

**确认日期**：YYYY-MM-DD HH:mm

---

### ✅ Checkpoint 3: 交付确认

**状态**：待确认 / 已验收 / 需要修改

**交付成果**：
- [x] 功能 1 已完成
- [x] 功能 2 已完成
- [x] 测试通过

**用户验收**：
- [ ] 功能符合预期
- [ ] 质量达标

**验收日期**：YYYY-MM-DD HH:mm

---

## 任务执行记录

### 任务分配

| 任务 | 执行者 | 状态 | 日期 |
|------|--------|------|------|
| 任务 1 | Dev-Agent-1 | 已完成 | YYYY-MM-DD |
| 任务 2 | Dev-Agent-2 | 已完成 | YYYY-MM-DD |
| 审查 | QA-Agent | 已通过 | YYYY-MM-DD |

### 审查记录

**审查人**：QA-Agent  
**审查日期**：YYYY-MM-DD  
**审查结论**：通过 / 有条件通过 / 不通过

**审查意见**：
- ✅ 优点：...
- ⚠️ 建议修改：...
- ❌ 必须修复：...

**修复情况**：
- [x] 问题 1 已修复
- [x] 问题 2 已修复

---

## 相关文件

- `.claude/harness/output/pm-agent.log` - PM Agent 日志
- `.claude/harness/output/code-review.md` - 审查记录

---

## 备注

- 自主协作模式，用户仅在 checkpoint 参与确认
- 中间过程由 AI 智能体自主完成

```

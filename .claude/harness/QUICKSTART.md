# 团队成员快速入门

欢迎加入团队！本文档帮助你快速开始使用 Harness 协作系统。

---

## 第一步：了解团队配置

查看 `.claude/harness/team.json` 了解：
- 团队成员列表
- 你的角色和权限
- 协作规则设置

```json
{
  "team": {
    "members": [
      {
        "name": "你的名字",
        "role": "developer",
        "skills": ["your-skills"]
      }
    ]
  }
}
```

---

## 第二步：查看当前任务

打开 `TASK.md` 查看：
- 当前任务目标
- 你的任务分配（`assignee`）
- 需要你审查的任务（`reviewers`）

```markdown
## 进行中
- [ ] 任务名称（P1）
  - 相关文件：`src/xxx.ts`
  - 当前状态：等待开发
  - 阻塞点：无
```

---

## 第三步：领取任务

如果 `assignee` 为空，你可以领取任务：

1. 确认任务在「待开始」或「进行中」状态
2. 将 `assignee` 设置为你自己
3. 更新 `status` 为 `in_progress`
4. 开始工作

```markdown
---
assignee: 你的名字  # ← 添加你的名字
status: in_progress  # ← 更新状态
---
```

---

## 第四步：开始工作

### 会话开始

每次新会话开始时：
1. Harness 自动检查 TASK.md
2. 确认任务锁状态
3. 开始工作

### 编码前检查

第一次写代码前，Harness 会自动检查：
- 任务分析是否完成
- TASK.md 状态是否为 `in_progress`
- 是否识别了相关文件

### 代码审查

完成代码后：
1. 运行自测
2. Harness 自动进行代码质量检查
3. 通知 reviewers 审查

---

## 第五步：完成任务

### 会话结束前

1. 总结本次完成的工作
2. 更新 TASK.md 的「已完成」列表
3. 记录下一步行动
4. Harness 自动进行会话结束检查

### 提交审查

```
完成代码 → 自测通过 → 提交 PR → 通知 reviewers
```

---

## 协作礼仪

### ✅ 推荐做法

- 领取任务后及时更新 `assignee`
- 离开前释放会话锁（更新 `lock` 或设置 `status: blocked`）
- 审查请求 24 小时内响应
- 完成任务后及时更新状态

### ❌ 避免做法

- 同时领取超过 3 个任务
- 长时间占用锁但不工作
- 跳过审查直接合并
- 修改他人正在工作的任务

---

## 会话锁机制

### 什么是会话锁

会话锁防止多人同时编辑同一任务：

```
获得锁 → 5 分钟内其他人收到警告 → 30 分钟内锁有效 → 过期后可接管
```

### 如何处理锁冲突

| 场景 | 处理方式 |
|------|----------|
| 5 分钟内 | 等待或协商 |
| 5-30 分钟 | 联系当前持有人 |
| 超过 30 分钟 | 可强制接管 |

---

## 使用 Teammates

### 什么是 Teammates

Teammates 模式允许 spawn 子 Agent 并行处理任务：

```
主 Agent → 分解任务 → spawn 子 Agent A, B, C → 汇总结果
```

### 何时使用

- ✅ 复杂任务需要并行处理
- ✅ 需要独立审查视角
- ✅ 测试和文档编写

### 如何使用

```
/agent create
分配具体任务给子 Agent
等待完成后汇总
```

---

## 常用命令

```bash
# 查看当前任务状态
cat TASK.md

# 运行所有 hooks 验证
cd .claude/harness && pnpm run verify

# 查看团队配置
cat .claude/harness/team.json

# 查看协作文档
cat .claude/harness/TEAMWORK.md
```

---

## 获取帮助

- 📖 完整协作文档：[TEAMWORK.md](TEAMWORK.md)
- 📖 Harness 使用说明：[README.md](README.md)
- 📖 迁移指南：[MIGRATION.md](MIGRATION.md)

---

## 检查清单

开始工作前，请确认：

- [ ] 已阅读团队配置（`team.json`）
- [ ] 已了解自己的角色和权限
- [ ] 已查看当前任务（`TASK.md`）
- [ ] 已了解会话锁机制
- [ ] 已了解代码审查流程

祝你工作愉快！🚀

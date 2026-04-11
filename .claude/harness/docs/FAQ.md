# Harness 常见问题解答

**用途**：通用 Harness Hooks 系统常见问题解答（不针对特定项目）

---

## Q1: TASK.md 是否会越来越长，影响 AI 专注力？

**答案**：是的，但我们有解决方案。

### 问题

随着项目开展，TASK.md 会 accumulating 越来越多的内容：
- 已完成的任务
- 历史决策记录
- 会话摘要

这会导致：
- AI 读取时间增加
- 上下文过长分散注意力
- Token 消耗增加
- 关键信息被稀释

### 解决方案：分离关注点

```
项目根目录/
├── TASK.md              # 当前任务（保持简短，<100 行）
├── CONTEXT.md           # 项目上下文和设计文档
├── COLLABORATION.md     # 团队沟通日志
└── .claude/
    └── sessions/        # 详细会话记录（每次会话归档）
        ├── session-init.md
        └── session-20240408-001.md
```

### 各文件职责

| 文件 | 内容 | 更新频率 | 长度控制 |
|------|------|----------|----------|
| `TASK.md` | 当前任务状态和进度 | 每次会话 | <100 行 |
| `CONTEXT.md` | 项目背景、架构 | 按需更新 | 适中 |
| `COLLABORATION.md` | 沟通、交接记录 | 每次会话 | 滚动更新 |
| `sessions/*.md` | 详细会话记录 | 每次会话归档 | 无限制 |

### 最佳实践

**✅ 推荐**：
- TASK.md 只保留当前迭代内容
- 已完成的任务归档到 `.claude/archive/tasks/`
- 详细会话记录放在 `.claude/sessions/`
- 使用链接引用其他文档

**❌ 避免**：
- 把所有内容塞进 TASK.md
- 从不归档历史内容
- 删除已完成任务（应归档而非删除）

---

## Q2: 团队成员之间如何沟通、协同工作？

**答案**：通过 `COLLABORATION.md` 和会话记录。

### 沟通方式

| 场景 | 工具 | 说明 |
|------|------|------|
| 任务交接 | `COLLABORATION.md` | 记录交接信息 |
| 代码审查 | `COLLABORATION.md` | 记录审查意见 |
| 进度同步 | `COLLABORATION.md` | 更新待办同步表 |
| 问题讨论 | `COLLABORATION.md` | 记录讨论过程 |
| 详细沟通 | 会话记录 | `.claude/sessions/*.md` |

### 协作流程

```
A 完成任务分析
    │
    ▼
在 COLLABORATION.md 中记录
    │
    ├── 沟通记录：分析完成
    ├── 待跟进：需要 B 审查
    └── 交接信息：当前状态、阻塞点
    │
    ▼
B 查看 COLLABORATION.md
    │
    ▼
B 进行审查并记录意见
    │
    ▼
审查通过 → A 继续实现
```

### 使用示例

**1. 任务交接**

```markdown
## 交接记录 [2026-04-08]

**交接人**：@张三
**接收人**：@李四
**任务**：代码质量检查 Hook

### 当前状态
- 已完成：需求分析、技术方案
- 进行中：编写代码
- 阻塞点：无

### 注意事项
- 需要支持多种包管理器
```

**2. 代码审查**

```markdown
## 审查记录 [2026-04-08]

**审查人**：@王五
**被审查内容**：pre-code-hook.ts

### 审查意见
- ✅ 优点：分析要素完整
- ⚠️ 建议：添加更多关键词检测
- ❌ 问题：无

### 审查结果
- [x] 通过
```

**3. 会话记录**

```markdown
## 会话：session-20260408-001

**参与者**：@张三
**日期**：2026-04-08 14:00-16:00

### 完成的工作
1. 增强了 PreCode Hook
2. 创建了会话记录模板

### 待跟进
- [ ] 需要李四测试 hooks
```

---

## Q3: 如何运行 Hooks 验证？

```bash
# 从项目根目录运行
cd .claude/harness

# 运行单个 hook
npx tsx hooks/session-start-hook.ts
npx tsx hooks/pre-code-hook.ts

# 或使用 pnpm
pnpm run hook:session-start
pnpm run hook:pre-code
pnpm run run-all
```

---

## Q4: 如何配置团队？

编辑 `.claude/harness/team.json`：

```json
{
  "team": {
    "members": [
      {
        "id": "001",
        "name": "张三",
        "role": "lead",
        "active": true
      }
    ]
  },
  "collaboration": {
    "sessionLock": {
      "timeoutMinutes": 30
    }
  }
}
```

---

## Q5: 需求分析有哪些必需章节？

PreCode Hook 会检查以下 5 个章节：

1. **需求理解** - 用户的核心需求
2. **优缺点分析** - 方案的优点和缺点
3. **边界条件** - 能做什么、不能做什么
4. **实现思路** - 技术方案和步骤
5. **文件影响** - 会编辑/创建哪些文件

缺少任何一项都会阻塞编码流程。

模板文件：`.claude/harness/templates/analysis-template.md`

---

## 相关文件

- [TASK.md](../TASK.md) - 当前任务
- [CONTEXT.md](../CONTEXT.md) - 项目上下文
- [COLLABORATION.md](../COLLABORATION.md) - 协作日志
- [TEAMWORK.md](TEAMWORK.md) - 团队规范
- [README.md](README.md) - 使用说明

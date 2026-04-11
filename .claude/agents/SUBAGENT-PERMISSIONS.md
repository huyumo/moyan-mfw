# Subagent 权限配置

## 权限模型说明

本配置采用 **分层权限模型**：
- **主 Agent**：仅协调，无代码编辑权限
- **Subagents**：根据职责授予不同级别的工具权限
- **权限隔离**：开发和测试职责分离，确保代码质量

---

## Subagent 权限配置

### 1. Tech-Architect（技术架构师）

**职责**：架构设计、技术选型、复杂问题解决

**工具权限**：
```markdown
tools: Read, Grep, Glob, Agent
```

**说明**：
- ✅ 只读权限 - 分析代码结构
- ✅ 可调用其他 subagent - 委托具体实现
- ❌ 不可编辑文件 - 仅输出设计方案

---

### 2. Project-Manager（项目经理）

**职责**：任务分配、进度跟踪、团队协调、**任务文档编辑**

**工具权限**：
```markdown
tools: Read, Grep, Glob, Agent, Write(.claude/**/TASK*.md), Edit(.claude/**/TASK*.md)
```

**说明**：
- ✅ 只读权限 - 查看项目状态
- ✅ 可调用 subagents - 分配任务
- ✅ 可编辑任务文档 - 更新任务状态、分配记录
- ❌ 不可编辑业务代码
- ❌ 不可编辑其他配置文件

---

### 3. Backend-TS-Node-Dev（后端开发）

**职责**：TypeScript/Node.js 后端开发

**工具权限**：
```markdown
tools: Read, Write, Edit, Glob, Grep, Bash
```

**允许编辑的目录**：
- `packages/base-backend/src/**`
- `backend/src/**`
- `packages/base-frontend/src/**` (仅 API 调用相关)

**说明**：
- ✅ 可编辑后端源代码
- ✅ Bash 访问 - 运行开发服务器、测试、数据库命令
- ⚠️ 需要遵循 hooks 检查流程
- ⚠️ 开发完成后必须提交 QA 审查，不能直接提交代码

---

### 4. Frontend-Dev（前端开发）

**职责**：UI/UX、前端组件、样式

**工具权限**：
```markdown
tools: Read, Write, Edit, Glob, Grep, Bash
```

**允许编辑的目录**：
- `packages/base-frontend/src/**`
- `frontend/src/**`
- `examples/src/**`

**说明**：
- ✅ 可编辑前端源代码
- ✅ Bash 访问 - 运行前端构建、测试
- ⚠️ 需要遵循 hooks 检查流程
- ⚠️ 开发完成后必须提交 QA 审查，不能直接提交代码

---

### 5. Code-Reviewer-Tester（代码审查和测试）

**职责**：代码质量审查、测试执行、**提交通过的代码**

**工具权限**：
```markdown
tools: Read, Grep, Glob, Bash, Write(tests/**), Write(test/**), Write(**/*.spec.ts), Write(**/*.test.ts), Edit(tests/**), Edit(test/**), Edit(**/*.spec.ts), Edit(**/*.test.ts)
```

**说明**：
- ✅ 只读权限 - 审查业务代码
- ✅ Bash 访问 - 运行测试、lint、typecheck、**git commit**
- ✅ 可编辑测试目录 - 编写和修改测试文件
- ✅ 可提交代码 - 测试通过后执行 git commit
- ❌ 不可编辑业务代码文件

**提交流程**：
1. 审查开发提交的代码（状态 `awaiting_qa`）
2. 执行测试验证
3. 测试通过 → 更新状态为 `qa_approved` → 执行 `git commit`
4. 测试失败 → 更新状态为 `rejected` → 打回开发修复

---

### 6. Docs-Architect（文档架构师）

**职责**：技术文档编写

**工具权限**：
```markdown
tools: Read, Write, Edit, Glob, Grep
```

**允许编辑的目录**：
- `docs/**`
- `**/*.md` (仅限文档目录)

**说明**：
- ✅ 可写文档文件 - `.md`, `.txt`
- ⚠️ 不可写代码文件 - `.ts`, `.js`, `.tsx`, `.vue`
- ❌ 无 Bash 访问 - 不需要运行命令

---

## Hooks 配置

### Pre-Code Hook（编码前检查）

在允许编辑/写入文件前自动执行：

```bash
cd .claude/harness && pnpm run hook:pre-code
```

**检查内容**：
- [ ] TASK.md 状态是否为 `in_progress`
- [ ] 需求分析文档是否完整
- [ ] 是否识别了影响文件

**失败动作**：阻止编码

---

### Code Quality Gate（代码质量门）

在提交代码前自动执行：

```bash
cd .claude/harness && pnpm run hook:code-quality
```

**检查内容**：
- [ ] TypeScript 类型检查
- [ ] 自我测试报告
- [ ] 自我反思记录
- [ ] **QA 审批状态（qa_approved）** ← 新增

**失败动作**：阻止提交

---

### QA Review Hook（QA 审查）

开发完成后触发：

```bash
cd .claude/harness && pnpm run hook:qa-review
```

**检查内容**：
- [ ] 代码审查完成
- [ ] 测试用例执行通过
- [ ] 缺陷报告（如有问题）

**失败动作**：打回开发

---

### Session-End Hook（会话结束检查）

在会话结束时执行：

```bash
cd .claude/harness && pnpm run hook:session-end
```

**检查内容**：
- [ ] 工作总结
- [ ] TASK.md 更新
- [ ] 下一步计划记录

**失败动作**：提醒（超过 3 次警告则阻止）

---

## 权限矩阵

| 工具/角色 | 主 Agent | Tech-Arch | PM | Backend | Frontend | QA | Docs |
|------|----------|-----------|----|---------|----------|----|----|
| Read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Write (源代码) | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Write (测试) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Write (任务文档) | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Write (文档) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Edit (源代码) | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Edit (测试) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Edit (任务文档) | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Glob | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Grep | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bash (开发) | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Bash (测试) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Bash (git) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Agent | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | ⚠️ |

**图例**：
- ✅ = 完全允许
- ⚠️ = 限制允许（仅限特定目录）
- ❌ = 禁止

---

## 任务状态流转（强制）

```
[pending] 
    ↓ (PM 分配/开发领取)
[in_progress] 
    ↓ (开发完成)
[awaiting_qa] 
    ↓ (QA 审查)
    ├─→ [qa_approved] → [completed] (QA 提交代码)
    └─→ [rejected] → [in_progress] (开发修复)
```

**状态编辑权限**：
- **PM** - 可编辑所有状态
- **开发** - 可改为 `in_progress` 和 `awaiting_qa`
- **QA** - 可改为 `qa_approved`、`rejected` 和 `completed`

---

## 配置文件

### 主权限配置
文件：`.claude/settings.local.json`

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Grep",
      "Glob",
      "Bash(curl *)",
      "WebFetch",
      "Agent"
    ],
    "roleSpecific": {
      "pm": ["Write(.claude/**/TASK*.md)", "Edit(.claude/**/TASK*.md)"],
      "backend": ["Write(packages/base-backend/src/**)", "Edit(packages/base-backend/src/**)"],
      "frontend": ["Write(packages/base-frontend/src/**)", "Edit(packages/base-frontend/src/**)"],
      "qa": ["Write(tests/**)", "Write(test/**)", "Write(**/*.spec.ts)", "Write(**/*.test.ts)", "Edit(tests/**)", "Edit(test/**)", "Edit(**/*.spec.ts)", "Edit(**/*.test.ts)", "Bash(git commit *)"],
      "docs": ["Write(docs/**)", "Write(**/*.md)", "Edit(docs/**)", "Edit(**/*.md)"]
    }
  }
}
```

### Subagent 定义
目录：`.claude/agents/`

每个 subagent 文件中通过 front matter 定义工具权限（仅作为提示，实际权限由 settings 控制）。

---

## 安全注意事项

1. **最小权限原则** - 只授予完成职责所必需的工具
2. **职责分离** - 开发者和审查者必须是不同的 agent
3. **Hook 强制检查** - 所有代码变更必须经过质量门
4. **QA 独享提交权** - 只有 QA 能执行 `git commit`
5. **PM 独享任务状态编辑权** - 任务文档只能由 PM 编辑
6. **审计日志** - 所有 subagent 调用记录在 `.claude/harness/output/`

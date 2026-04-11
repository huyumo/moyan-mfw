# Agent 配置总结

**配置日期**: 2026-04-10
**配置目标**: 主 agent 仅协调，不参与代码开发

---

## ✅ 配置完成状态

| 配置项 | 状态 | 文件位置 |
|--------|------|----------|
| 主 Agent 权限限制 | ✅ 完成 | `.claude/settings.local.json` |
| Subagent 权限配置 | ✅ 完成 | `.claude/agents/*.md` |
| Hooks 配置 | ✅ 完成 | `.claude/settings.local.json` |
| 使用文档 | ✅ 完成 | `.claude/agents/MAIN-AGENT-GUIDE.md` |

---

## 📋 配置详情

### 1. 主 Agent 权限（`.claude/settings.local.json`）

**允许的工具**:
- `Read` - 读取文件
- `Grep` - 搜索内容
- `Glob` - 搜索文件
- `Bash(curl *)` - 网络请求
- `WebFetch` - 获取网页
- `Agent` - 调用 subagent（核心工具）
- `Edit(.claude/harness/**)` - 仅限 harness 配置
- `Write(.claude/harness/**)` - 仅限 harness 配置

**禁止的工具**:
- `Edit(!.claude/harness/**)` - 禁止编辑项目代码
- `Write(!.claude/harness/**)` - 禁止写入项目代码

---

### 2. Subagent 配置

| Subagent | 工具权限 | 职责 |
|----------|----------|------|
| **tech-architect** | Read, Grep, Glob, Agent | 架构设计（只读） |
| **project-manager** | Read, Grep, Glob, Agent | 任务协调（只读） |
| **backend-ts-node-dev** | Read, Write, Edit, Glob, Grep, Bash | 后端开发（完整权限） |
| **frontend-dev** | Read, Write, Edit, Glob, Grep, Bash | 前端开发（完整权限） |
| **code-reviewer-tester** | Read, Grep, Glob, Bash | 代码审查（只读 + 测试） |
| **docs-architect** | Read, Write, Edit, Glob, Grep, WebFetch | 文档编写 |

---

### 3. Hooks 配置

| Hook | 触发条件 | 检查内容 | 失败动作 |
|------|----------|----------|----------|
| `hook:pre-code` | Write/Edit 前 | TASK.md 状态、分析文档完整性 | 阻止编码 |
| `hook:code-quality` | Write/Edit 后 | TypeScript 检查、自测报告 | 阻止提交 |
| `hook:session-end` | 会话结束 | 工作总结、TASK.md 更新 | 提醒/阻止 |

---

## 🎯 主 Agent 调用 Subagent 示例

### 示例：开发用户积分系统

```
主 Agent 工作流：

1. 分析需求（不写代码）
   - 积分系统需要：数据库、API、前端、文档

2. 调用 subagents（使用 Agent 工具）
   - tech-architect → 设计架构
   - backend-ts-node-dev → 实现后端
   - frontend-dev → 实现前端
   - code-reviewer-tester → 审查测试
   - docs-architect → 编写文档

3. 整合结果
   - 汇总各 subagent 输出
   - 向用户报告完成情况
```

---

## 📁 文件清单

### Agent 定义文件（`.claude/agents/`）
- `MAIN-AGENT-GUIDE.md` - 主 Agent 使用指南 ⭐
- `MAIN-AGENT-COORDINATOR.md` - 主 Agent 职责说明
- `SUBAGENT-GUIDE.md` - Subagent 通用指南
- `SUBAGENT-PERMISSIONS.md` - Subagent 权限配置
- `backend-ts-node-dev.md` - 后端开发 agent
- `frontend-dev.md` - 前端开发 agent
- `tech-architect.md` - 技术架构师
- `project-manager.md` - 项目经理
- `code-reviewer-tester.md` - 代码审查测试
- `docs-architect.md` - 文档架构师

### 配置文件
- `.claude/settings.local.json` - 主权限配置 ⭐
- `.claude/harness/team.json` - 团队配置
- `.claude/harness/config.json` - Hooks 配置

---

## 🔍 验证步骤

### 1. 验证主 Agent 权限

尝试编辑项目代码应被拒绝：
```
主 Agent: "让我修改 src/api/users.ts"
→ 应该被权限系统阻止
```

### 2. 验证 Subagent 调用

调用 subagent 应该成功：
```
主 Agent: 调用 Agent 工具
- subagent_type: backend-ts-node-dev
- prompt: 创建一个简单的 API 端点
→ 应该成功执行
```

### 3. 验证 Hooks

编辑文件后应触发质量检查：
```
backend-ts-node-dev: Write src/api/test.ts
→ 触发 hook:code-quality
```

---

## 📚 文档引用

- [MAIN-AGENT-GUIDE.md](./MAIN-AGENT-GUIDE.md) - **主 Agent 必读**
- [SUBAGENT-GUIDE.md](./SUBAGENT-GUIDE.md) - Subagent 使用指南
- [SUBAGENT-PERMISSIONS.md](./SUBAGENT-PERMISSIONS.md) - 权限配置详情

---

## ⚠️ 重要提醒

**主 Agent 必须遵守的原则**：

1. **不写代码** - 所有代码编写必须由 subagent 完成
2. **使用 Agent 工具** - 需要执行任务时，调用相应的 subagent
3. **保持协调角色** - 负责分析、分解、分配、跟踪、整合
4. **遵守权限限制** - 只能修改 `.claude/harness/` 目录

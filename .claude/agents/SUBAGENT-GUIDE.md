# Subagent 配置和使用指南

**基于 Claude Code 官方文档** - 最后更新：2026-04-10

---

## 什么是 Subagent

**Subagent（子代理）** 是专门化的 AI 助手，用于：
- 隔离上下文处理特定子任务
- 并行执行独立工作
- 应用专门化的指令和知识
- 限制工具访问权限提高安全性

---

## 两种创建方式

### 方式 1：文件系统定义（推荐用于 Claude Code）

在 `.claude/agents/` 目录中创建 Markdown 文件。

**示例结构：**
```markdown
---
name: code-reviewer
description: "代码审查专家。用于代码质量、安全性和可维护性审查。"
tools: Read, Grep, Glob
model: sonnet
memory: project
---

你是代码审查专家，专注于安全性、性能和最佳实践。

## 职责
- 识别安全漏洞
- 检查性能问题
- 验证编码标准
- 建议具体改进

## 输出格式
- 问题列表（按严重程度排序）
- 具体修复建议
- 代码示例
```

### 方式 2：程序化定义（用于 Agent SDK）

```typescript
import { query, ClaudeAgentOptions, AgentDefinition } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  async for message of query({
    prompt: "审查认证模块的安全问题",
    options: ClaudeAgentOptions({
      allowedTools: ["Read", "Grep", "Glob", "Agent"],
      agents: {
        "code-reviewer": AgentDefinition({
          description: "代码审查专家。用于质量、安全和维护性审查。",
          prompt: """你是代码审查专家...""",
          tools: ["Read", "Grep", "Glob"],
          model: "sonnet",
        }),
      },
    }),
  });
}
```

---

## 配置文件说明

### Front Matter 字段

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `name` | string | 代理名称（必需） | `code-reviewer` |
| `description` | string | 何时使用此代理（必需） | "代码审查时使用..." |
| `tools` | string[] | 允许的工具列表 | `Read, Grep, Glob` |
| `model` | string | 使用的模型 | `sonnet`, `opus`, `haiku`, `inherit` |
| `memory` | string | 记忆类型 | `user`, `project`, `local` |
| `color` | string | UI 颜色 | `blue`, `green`, `purple` |

### 工具权限最佳实践

| 代理类型 | 推荐工具 | 说明 |
|----------|----------|------|
| **只读审查** | Read, Grep, Glob | 代码审查、文档分析 |
| **测试执行** | Bash, Read, Grep | 运行测试、分析结果 |
| **完整开发** | 所有工具 | 全功能开发代理 |

---

## 如何使用 Subagent

### 方法 1：自动调用

当你的 prompt 中提到代理名称时，Claude Code 会自动调用：

```
"使用 code-reviewer 代理审查这个认证模块"
"让 tech-architect 设计这个 API 的架构"
```

### 方法 2：明确调用

使用 Agent 工具明确调用：

```
调用 Agent 工具：
- subagent_type: code-reviewer
- prompt: 审查 authentication.ts 的安全性
```

### 方法 3：在 VS Code 中

1. 打开命令面板 (Ctrl+Shift+P)
2. 选择 "Claude Code: Run Agent"
3. 选择子代理
4. 输入任务描述

---

## 当前项目配置

### 已有 Subagents

| 代理 | 职责 | 工具 | 模型 |
|------|------|------|------|
| **tech-architect** | 架构设计、技术决策 | 所有工具 | opus |
| **project-manager** | 项目管理、任务分配 | 所有工具 | inherit |
| **backend-ts-node-dev** | 后端开发（TypeScript/Node.js） | 所有工具 | inherit |
| **frontend-dev** | 前端开发 | 所有工具 | inherit |
| **code-reviewer-tester** | 代码审查和测试 | 所有工具 | inherit |
| **docs-architect** | 文档编写 | 文档工具 | opus |

### 配置位置

- **代理定义**: `.claude/agents/` 目录
- **团队配置**: `.claude/harness/team.json`
- **权限设置**: `.claude/settings.json`

---

## 高级用法

### 动态代理配置

```typescript
// 工厂函数根据运行时条件创建代理
function createSecurityAgent(securityLevel: string): AgentDefinition {
  const isStrict = securityLevel === "strict";
  return AgentDefinition({
    description: "安全代码审查员",
    prompt: `你是一个${isStrict ? '严格' : '平衡'}的安全审查员...`,
    tools: ["Read", "Grep", "Glob"],
    model: isStrict ? "opus" : "sonnet",  // 高风险使用更强模型
  });
}
```

### 恢复 Subagent 会话

```typescript
// 第一次调用 - 捕获 session_id 和 agentId
let sessionId: string | undefined;
let agentId: string | undefined;

for await (const message of query({
  prompt: "使用 Explore 代理查找所有 API 端点",
  options: { allowedTools: ["Read", "Grep", "Glob", "Agent"] }
})) {
  if ("session_id" in message) sessionId = message.session_id;
  const extractedId = extractAgentId(message);
  if (extractedId) agentId = extractedId;
}

// 第二次调用 - 恢复并问后续问题
if (agentId && sessionId) {
  for await (const message of query({
    prompt: `恢复代理 ${agentId} 并列出最复杂的 3 个端点`,
    options: { allowedTools: ["Read", "Grep", "Glob", "Agent"], resume: sessionId }
  })) {
    // 处理结果
  }
}
```

### 检测 Subagent 调用

```typescript
for await (const message of query({...})) {
  // 检查 subagent 调用
  if (hasattr(message, "content")) {
    for (const block of message.content) {
      if (block.type === "tool_use" && block.name in ["Task", "Agent"]) {
        console.log(`调用子代理：${block.input.subagent_type}`);
      }
    }
  }
  
  // 检查是否在子代理上下文中运行
  if (message.parent_tool_use_id) {
    console.log("  (在子代理中运行)");
  }
}
```

---

## 常见问题

### Q: Claude 不调用 subagent？

**解决方案：**
1. 确保主代理有 `Agent` 工具权限
2. 在 prompt 中明确提到 subagent 名称
3. 编写清晰的 description 说明何时使用

### Q: 文件系统代理不加载？

**解决方案：**
1. 确保文件在 `.claude/agents/` 目录中
2. 检查 YAML front matter 格式正确
3. 验证 `name` 和 `description` 字段存在

### Q: 如何限制 subagent 权限？

**解决方案：**
在 front matter 中指定 `tools` 字段：

```markdown
---
name: security-scanner
tools: Read, Grep  # 只读权限
---
```

---

## 相关文档

- [Claude Code 官方文档 - Subagents](https://code.claude.com/docs/en/sub-agents)
- [Agent SDK - Subagents](https://code.claude.com/docs/en/agent-sdk/subagents)
- [权限配置](https://code.claude.com/docs/en/permissions)

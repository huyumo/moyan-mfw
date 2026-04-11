# Subagent Hooks 配置说明

**文档版本**: 2026-04-10
**来源**: Claude Code 官方文档 + 本地配置分析

---

## 📋 官方文档说明

### SubagentStart Hook

**触发时机**: 当通过 `Agent` 工具生成 Claude Code subagent 时运行

**支持的匹配器**:
- 内置 Agent 名称：`Bash`, `Explore`, `Plan`
- 自定义 Agent 名称：来自 `.claude/agents/` 目录

**输入数据**:
```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../xxx.jsonl",
  "cwd": "/Users/...",
  "hook_event_name": "SubagentStart",
  "agent_id": "agent-abc123",
  "agent_type": "Explore"  // 或自定义 agent 名称
}
```

---

### SubagentStop Hook

**触发时机**: 当 Claude Code subagent 完成响应时运行

**匹配器**: 与 SubagentStart 相同的 agent type 值

**输入数据**:
```json
{
  "hook_event_name": "SubagentStop",
  "stop_hook_active": false,
  "agent_id": "def456",
  "agent_type": "Explore",
  "agent_transcript_path": "/path/to/transcript.jsonl",
  "last_assistant_message": "..."  // 最后一条助手消息
}
```

---

## 🔍 本地配置分析

### 当前 hooks 配置

**文件**: `.claude/settings.json`

```json
{
  "hooks": {
    "PostToolUse": [ ... ],  // ✅ 已配置
    "PreToolUse": [ ... ],   // ✅ 已配置
    "SessionEnd": [ ... ],   // ✅ 已配置
    "SessionStart": [ ... ]  // ✅ 已配置
  }
}
```

### 缺失的 hooks

| Hook 事件 | 状态 | 用途 |
|----------|------|------|
| `SubagentStart` | ❌ 未配置 | subagent 启动时触发 |
| `SubagentStop` | ❌ 未配置 | subagent 结束时触发 |
| `TaskCreated` | ❌ 未配置 | 任务创建时触发 |
| `TaskCompleted` | ❌ 未配置 | 任务完成时触发 |

---

## ⚠️ 问题分析

### 当前配置的影响

1. **Subagent 工作时不会触发 hooks**
   - 主 agent 的 `PreToolUse` 和 `PostToolUse` hooks **不会**在 subagent 内部触发
   - 因为 subagent 有独立的执行上下文

2. **代码质量检查可能遗漏**
   - 如果 subagent 编写代码，`hook:code-quality` 可能不会被触发
   - 需要配置 `SubagentStop` 来检查 subagent 的工作成果

3. **无法监控 subagent 行为**
   - 无法在 subagent 启动时注入额外上下文
   - 无法在 subagent 结束时审查输出

---

## ✅ 推荐的 Hooks 配置

### 方案 1：SubagentStop 质量检查

在 subagent 完成后检查其工作成果：

```json
{
  "hooks": {
    "SubagentStop": [
      {
        "hooks": [
          {
            "command": "cd .claude/harness && pnpm run hook:subagent-review",
            "statusMessage": "🔔 审查 subagent 工作成果...",
            "timeout": 60,
            "type": "command"
          }
        ],
        "matcher": "backend-ts-node-dev|frontend-dev"
      }
    ]
  }
}
```

### 方案 2：SubagentStart 安全上下文注入

在 subagent 启动时注入安全指南：

```json
{
  "hooks": {
    "SubagentStart": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "确保遵循项目安全规范和编码标准"
          }
        ],
        "matcher": ".*"
      }
    ]
  }
}
```

### 方案 3：完整的 hooks 配置

```json
{
  "hooks": {
    "SubagentStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo '注入安全上下文到 subagent'"
          }
        ],
        "matcher": "backend-ts-node-dev|frontend-dev"
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "cd .claude/harness && pnpm run hook:subagent-review",
            "statusMessage": "🔔 审查 subagent 输出",
            "timeout": 120
          }
        ],
        "matcher": "backend-ts-node-dev|frontend-dev|code-reviewer-tester"
      }
    ],
    "PostToolUse": [
      {
        "hooks": [
          {
            "command": "cd .claude/harness && pnpm run hook:code-quality",
            "statusMessage": "🔔 运行代码质量检查",
            "timeout": 180,
            "type": "command"
          }
        ],
        "matcher": "Write|Edit"
      }
    ]
  }
}
```

---

## 📝 Subagent Hook 脚本示例

### 创建 `hooks/subagent-review-hook.ts`

```typescript
/**
 * Subagent 输出审查 Hook
 * 
 * 审查 subagent 完成后的输出：
 * - 检查是否遵循了编码规范
 * - 验证是否有安全漏洞
 * - 确认任务完成度
 */

import * as fs from 'fs';
import * as path from 'path';

interface HookResult {
  passed: boolean;
  message: string;
  warnings: string[];
  errors: string[];
  data?: {
    agentType: string;
    transcriptPath: string;
    filesModified: string[];
    securityIssues: Array<{ file: string; issue: string }>;
  };
}

export async function run(args: string[]): Promise<HookResult> {
  const result: HookResult = {
    passed: true,
    message: '',
    warnings: [],
    errors: []
  };

  // 从环境变量或参数获取 subagent 信息
  const agentType = process.env.SUBAGENT_TYPE || args[0] || 'unknown';
  const transcriptPath = process.env.SUBAGENT_TRANSCRIPT_PATH || '';

  // 读取 subagent transcript
  let transcriptContent = '';
  if (transcriptPath && fs.existsSync(transcriptPath)) {
    transcriptContent = fs.readFileSync(transcriptPath, 'utf-8');
  }

  // 分析 subagent 行为
  const filesModified: string[] = [];
  const securityIssues: Array<{ file: string; issue: string }> = [];

  // 检查是否有文件修改
  const writeMatches = transcriptContent.match(/Write\([^)]+\)/g);
  const editMatches = transcriptContent.match(/Edit\([^)]+\)/g);
  
  if (writeMatches) filesModified.push(...writeMatches);
  if (editMatches) filesModified.push(...editMatches);

  // 安全检查示例
  if (transcriptContent.includes('eval(') || transcriptContent.includes('exec(')) {
    securityIssues.push({
      file: 'transcript',
      issue: '检测到 eval/exec 使用，可能存在代码注入风险'
    });
  }

  // 构建结果
  if (securityIssues.length > 0) {
    result.passed = false;
    result.errors = securityIssues.map(i => i.issue);
    result.message = `❌ ${agentType} 审查失败：发现 ${securityIssues.length} 个安全问题`;
  } else if (filesModified.length > 0) {
    result.message = `✅ ${agentType} 审查通过 - 修改了 ${filesModified.length} 个文件`;
    result.warnings.push('请确保已运行测试验证修改');
  } else {
    result.message = `✅ ${agentType} 审查通过 - 无文件修改`;
  }

  result.data = {
    agentType,
    transcriptPath,
    filesModified,
    securityIssues
  };

  return result;
}
```

---

## 🔄 Hook 触发流程图

```
主 Agent 会话
    │
    ├─→ 用户提交 prompt
    │       │
    │       └─→ SessionStart (如果新会话)
    │
    ├─→ 主 Agent 调用 Agent 工具
    │       │
    │       └─→ SubagentStart ──→ [注入上下文]
    │
    ├─→ Subagent 执行任务
    │       │
    │       ├─→ Subagent 内部 Write/Edit
    │       │       │
    │       │       └─→ ⚠️ 不会触发主 Agent 的 PostToolUse
    │       │
    │       └─→ Subagent 完成
    │               │
    │               └─→ SubagentStop ──→ [审查输出]
    │
    └─→ 主 Agent 整合结果
            │
            └─→ SessionEnd
```

---

## 📋 配置检查清单

### 必需配置

- [ ] 在 `settings.json` 中添加 `SubagentStop` hook
- [ ] 创建 `hooks/subagent-review-hook.ts` 脚本
- [ ] 在 `package.json` 中添加 `hook:subagent-review` 命令
- [ ] 测试 hook 是否正确触发

### 可选配置

- [ ] 添加 `SubagentStart` hook 注入上下文
- [ ] 为不同 agent 类型配置不同的 hooks
- [ ] 添加 `TaskCreated` 和 `TaskCompleted` hooks

---

## 🔗 相关文档

- [官方 Hooks 文档](https://code.claude.com/docs/en/hooks)
- [Subagents 文档](https://code.claude.com/docs/en/agent-sdk/subagents)
- [本地配置总结](./CONFIG-SUMMARY.md)

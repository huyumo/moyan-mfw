# Hook 调用日志使用指南

## 概述

Harness 现在支持完整的 Hook 调用日志记录功能，用于追踪和审计每个事件节点的 Hook 执行情况。

## 日志文件位置

```
.harness/output/logs/hook-calls.log
```

## 日志格式

```
[timestamp] [event] [hook-name] [status] [duration]
```

### 字段说明

| 字段 | 说明 | 示例 |
|------|------|------|
| timestamp | ISO 8601 时间戳 | `2026-04-11T14:59:37.112Z` |
| event | 触发事件类型 | `SessionStart`, `PreToolUse`, `PostToolUse`, `SubagentStart`, `SubagentStop`, `SessionEnd` |
| hook-name | Hook 名称 | `hook:identity`, `hook:session-start` |
| status | 执行状态 | `started`, `completed`, `failed` |
| duration | 执行时间（仅 completed/failed） | `1199ms` |

### 示例日志

```log
[2026-04-11T14:59:37.112Z] [SessionStart   ] [hook:session-start       ] [started   ]
[2026-04-11T14:59:38.113Z] [SessionStart   ] [hook:session-start       ] [completed ] 998ms
[2026-04-11T15:00:00.000Z] [PreToolUse    ] [hook:pre-code            ] [started   ]
[2026-04-11T15:00:01.500Z] [PreToolUse    ] [hook:pre-code            ] [completed ] 1500ms
[2026-04-11T15:00:05.000Z] [SubagentStart ] [hook:backend-security    ] [failed    ] 200ms ERROR: exit code 1
```

## 查看日志

### 1. 查看调用摘要

```bash
cd .harness
pnpm run log:summary
```

输出示例：
```
=== Hook 调用摘要 ===

SessionStart:
  总计：5, 完成：5, 失败：0

PreToolUse:
  总计：12, 完成：12, 失败：0

SubagentStart:
  总计：8, 完成：7, 失败：1
```

### 2. 查看完整历史

```bash
cd .harness
pnpm run log:history
```

### 3. 查看特定事件的调用历史

```bash
cd .harness
pnpm run log:history SessionStart
```

### 4. 直接查看日志文件

```bash
cat .harness/output/logs/hook-calls.log
```

## 配置说明

### .claude/settings.json

所有 hooks 现在都通过 `run-hook.ts` 包装器执行，自动记录调用日志：

```json
{
  "hooks": {
    "SessionStart": [
      {
        "command": "pnpm --filter @claude-code/harness tsx scripts/run-hook.ts SessionStart hook:identity \"pnpm run hook:identity\""
      }
    ]
  }
}
```

### 脚本文件

| 文件 | 用途 |
|------|------|
| `.harness/scripts/run-hook.ts` | Hook 执行包装器，记录调用日志 |
| `.harness/scripts/hook-call-logger.ts` | 日志查询工具 |

## 事件类型

| 事件 | 触发时机 | 相关 Hooks |
|------|----------|-----------|
| `SessionStart` | 会话开始 | hook:identity, hook:session-start |
| `PreToolUse` | 写/编辑文件前 | hook:pre-code |
| `PostToolUse` | 写/编辑文件后 | hook:code-quality |
| `SubagentStart` | Agent 启动时 | hook:pm-context, hook:architect-context, hook:backend-security, hook:frontend-guidelines, hook:review-checklist, hook:docs-template |
| `SubagentStop` | Agent 停止后 | hook:subagent-review |
| `SessionEnd` | 会话结束 | hook:session-end |

## 对比检查 Hook 执行情况

### 1. 检查是否有遗漏的事件

```bash
# 查看所有事件的调用统计
pnpm run log:summary

# 对比 settings.json 中配置的事件类型
```

### 2. 检查失败的 Hook

```bash
# 查看历史，过滤 failed 状态
pnpm run log:history | grep failed
```

### 3. 分析执行时间

```bash
# 查看日志文件，分析 duration
cat .harness/output/logs/hook-calls.log | grep completed
```

## 故障排查

### 问题：日志文件为空

**原因**：
- Hook 未通过 `run-hook.ts` 包装器执行
- 日志目录权限问题

**解决**：
1. 检查 `.claude/settings.json` 中的 commands 是否正确配置
2. 检查 `.harness/output/logs/` 目录是否存在

### 问题：统计数字不正确

**原因**：
- 日志解析逻辑问题

**解决**：
1. 检查日志格式是否符合标准
2. 运行 `pnpm tsx scripts/hook-call-logger.ts --history` 查看原始解析结果

## 下次摸底测试时的检查步骤

1. **清理日志**（可选）：
   ```bash
   rm .harness/output/logs/hook-calls.log
   ```

2. **执行摸底测试任务**

3. **检查日志**：
   ```bash
   # 查看摘要
   pnpm run log:summary
   
   # 查看完整历史
   pnpm run log:history
   
   # 检查是否有 failed
   pnpm run log:history | grep failed
   ```

4. **对比 settings.json 配置**：
   - 确认每个事件类型都有对应的日志记录
   - 确认没有遗漏的 Hook 调用

5. **记录分析结果**到 TASK 文档

# Subagent Hooks 配置总结

**配置日期**: 2026-04-10
**配置目标**: 确保 subagent 工作时正确触发 hooks，进行质量审查

---

## ✅ 配置完成状态

| 配置项 | 状态 | 文件位置 |
|--------|------|----------|
| SubagentStop Hook | ✅ 完成 | `.claude/settings.json` |
| Subagent Review 脚本 | ✅ 完成 | `.claude/harness/hooks/subagent-review-hook.ts` |
| NPM 脚本 | ✅ 完成 | `.claude/harness/package.json` |
| 配置文档 | ✅ 完成 | `.claude/harness/docs/SUBAGENT-HOOKS.md` |

---

## 📋 配置详情

### 1. SubagentStop Hook 触发

**文件**: [`.claude/settings.json`](./../../settings.json)

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
        "matcher": "backend-ts-node-dev|frontend-dev|code-reviewer-tester|docs-architect"
      }
    ]
  }
}
```

**触发时机**: 当指定的 subagent 完成工作并停止时

**匹配的 subagent**:
- `backend-ts-node-dev` - 后端开发
- `frontend-dev` - 前端开发
- `code-reviewer-tester` - 代码审查
- `docs-architect` - 文档编写

---

### 2. Subagent Review Hook 脚本

**文件**: [`.claude/harness/hooks/subagent-review-hook.ts`](./hooks/subagent-review-hook.ts)

**功能**:
1. 读取 subagent 的 transcript 文件
2. 分析修改的文件列表
3. 检查安全问题（eval、exec 等危险操作）
4. 生成审查报告

**安全检查项目**:
- `eval()` - 代码注入风险
- `exec()` - 命令注入风险
- `system()` - 命令注入风险
- `__proto__` - 原型污染风险
- `constructor.prototype` - 原型污染风险

**输出**:
- 审查结果 JSON: `.claude/harness/output/subagent-review.json`
- 文件修改日志：`.claude/harness/output/subagent-files.log`

---

### 3. Hook 触发流程

```
用户请求
    │
    └─→ 主 Agent 分析任务
            │
            └─→ 调用 Agent 工具
                    │
                    ├─→ SubagentStart (未配置)
                    │
                    ├─→ Subagent 执行任务
                    │       │
                    │       ├─→ Read/Grep/Glob (只读操作)
                    │       ├─→ Write/Edit (编写代码)
                    │       └─→ Bash (运行命令)
                    │
                    └─→ Subagent 完成
                            │
                            └─→ SubagentStop 触发 ✅
                                    │
                                    └─→ hook:subagent-review
                                            │
                                            ├─→ 读取 transcript
                                            ├─→ 分析文件修改
                                            ├─→ 安全检查
                                            └─→ 生成审查报告
```

---

## ⚠️ 重要说明

### Subagent 内部的 Hooks

**Subagent 内部不会触发主 Agent 的 hooks**:

| Hook 事件 | 主 Agent | Subagent 内部 |
|----------|----------|---------------|
| `PreToolUse` | ✅ 触发 | ❌ 不触发 |
| `PostToolUse` | ✅ 触发 | ❌ 不触发 |
| `SubagentStop` | ✅ 触发 | N/A |

**原因**: Subagent 有独立的执行上下文和会话空间。

**解决方案**: 使用 `SubagentStop` hook 在 subagent 完成后审查其工作成果。

---

### 代码质量检查流程

为确保 subagent 编写的代码质量，配置了多层检查：

1. **Subagent 自我审查** - subagent 在完成后自我反思
2. **SubagentStop Hook** - 审查 subagent 输出
3. **PostToolUse Hook** - 主 Agent 上下文的代码质量检查（如果主 Agent 写入文件）

---

## 📁 文件清单

### Hooks 配置
- `.claude/settings.json` - 主配置文件 ✅
- `.claude/harness/package.json` - NPM 脚本 ✅

### Hook 脚本
- `.claude/harness/hooks/subagent-review-hook.ts` - Subagent 审查 ✅

### 文档
- `.claude/harness/docs/SUBAGENT-HOOKS.md` - 详细说明 ✅
- `.claude/agents/SUBAGENT-PERMISSIONS.md` - Subagent 权限配置
- `.claude/agents/MAIN-AGENT-GUIDE.md` - 主 Agent 使用指南

---

## 🔍 测试方法

### 1. 测试 SubagentStop Hook

```bash
# 1. 启动 Claude Code 会话
# 2. 调用 subagent: "让 backend-ts-node-dev 创建一个简单的 API"
# 3. 观察是否触发 hook:subagent-review
# 4. 检查输出文件：.claude/harness/output/subagent-review.json
```

### 2. 手动运行 Hook

```bash
cd .claude/harness
pnpm run hook:subagent-review
```

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| [SUBAGENT-HOOKS.md](./docs/SUBAGENT-HOOKS.md) | Subagent hooks 详细说明 |
| [MAIN-AGENT-GUIDE.md](../../agents/MAIN-AGENT-GUIDE.md) | 主 Agent 使用指南 |
| [CONFIG-SUMMARY.md](../../agents/CONFIG-SUMMARY.md) | Agent 配置总结 |

---

## ⚠️ 注意事项

1. **SubagentStop 在 subagent 完成后触发** - 不是在每次工具调用时触发
2. **审查基于 transcript** - 需要 subagent 完成并生成 transcript 后才能审查
3. **安全检查是静态分析** - 无法检测运行时问题，仍需测试验证

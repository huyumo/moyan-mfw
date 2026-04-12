# Harness Hooks 配置验证报告

**验证日期**: 2026-04-12  
**验证状态**: ⚠️ 需要新会话验证

---

## 问题描述

用户反馈开启新会话后没有激活 `.harness` 钩子。

---

## 验证结果

### ✅ 配置文件正确

| 配置文件 | 状态 | 说明 |
|----------|------|------|
| `.claude/settings.json` | ✅ 正确 | 包含完整的 hooks 配置 |
| `.claude/settings.local.json` | ✅ 已更新 | 已合并 hooks 配置 |
| `.harness/package.json` | ✅ 正确 | 包含所有 hook scripts |
| `.harness/config/paths.json` | ✅ 正确 | 路径配置已修复 |

### ✅ Hook 脚本正常

| Hook | 手动测试 | 说明 |
|------|----------|------|
| hook:identity | ✅ 通过 | 7 个团队成员识别正确 |
| hook:session-start | ✅ 通过 | TASK.md 读取正常 |
| hook:backend-security | ✅ 通过 | 配置加载正常 |
| hook:frontend-guidelines | ✅ 通过 | 配置加载正常 |
| hook:architect-context | ✅ 通过 | 配置加载正常 |
| hook:review-checklist | ✅ 通过 | 配置加载正常 |
| hook:docs-template | ✅ 通过 | 配置加载正常 |
| hook:pm-context | ✅ 通过 | 配置加载正常 |
| hook:session-end | ✅ 通过 | 检查逻辑正常 |

### ⚠️ 可能的问题

| 问题 | 状态 | 说明 |
|------|------|------|
| hooks 配置未合并 | ⚠️ 待确认 | `.claude/settings.local.json` 可能覆盖主配置 |
| 新会话未触发 | ⚠️ 待验证 | 需要在新会话中测试 |
| 日志目录权限 | ✅ 正常 | 已验证可写入 |

---

## 修复措施

### 1. 更新 settings.local.json

已将 hooks 配置合并到 `.claude/settings.local.json`：

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "cd .harness && pnpm run hook:identity",
            "timeout": 30,
            "statusMessage": "🔔 运行 Harness 身份报告检查..."
          },
          {
            "type": "command",
            "command": "cd .harness && pnpm run hook:session-start",
            "timeout": 60,
            "statusMessage": "🔔 运行 Harness 会话开始检查..."
          }
        ]
      }
    ],
    ...
  }
}
```

### 2. 简化命令

从 `pnpm --filter @claude-code/harness` 改为 `cd .harness && pnpm run`，避免 pnpm workspace 过滤问题。

---

## 验证步骤

### 方法 1: 重启会话

1. 关闭当前 Claude Code 会话
2. 重新打开 Claude Code
3. 检查是否自动触发 SessionStart hooks
4. 查看日志：`cat .harness/output/logs/hook-calls.log`

### 方法 2: 手动触发测试

```bash
# 测试 SessionStart hooks
cd .harness && pnpm run hook:identity
cd .harness && pnpm run hook:session-start

# 查看日志
cat .harness/output/logs/hook-calls.log
```

### 方法 3: 召唤 Agent 测试

召唤任意 Agent（如 PM-Agent），检查是否触发 SubagentStart hooks。

---

## 预期日志输出

### SessionStart 触发后

```bash
$ cat .harness/output/logs/hook-calls.log

[timestamp] [SessionStart   ] [hook:identity           ] [started   ]
[timestamp] [SessionStart   ] [hook:identity           ] [completed ] XXXms
[timestamp] [SessionStart   ] [hook:session-start      ] [started   ]
[timestamp] [SessionStart   ] [hook:session-start      ] [completed ] XXXms
```

### SubagentStart 触发后

```bash
$ cat .harness/output/logs/hook-calls.log

[timestamp] [SubagentStart ] [hook:pm-context         ] [started   ]
[timestamp] [SubagentStart ] [hook:pm-context         ] [completed ] XXXms
```

---

## 配置检查清单

- [x] `.claude/settings.json` hooks 配置完整
- [x] `.claude/settings.local.json` 合并 hooks 配置
- [x] `.harness/package.json` scripts 完整
- [x] `.harness/config/paths.json` 路径正确
- [x] `.harness/team.json` 团队配置正确
- [x] `.harness/output/logs/` 目录存在
- [x] 所有 hook 脚本 TypeScript 检查通过

---

## 下一步

1. **关闭并重新打开 Claude Code 会话**
2. **观察是否自动触发 SessionStart hooks**
3. **检查日志文件是否有记录**
4. **如无记录，检查 Claude Code 日志**

---

## 故障排除

### 如果 hooks 仍然不触发

1. 检查 Claude Code 是否读取了正确的配置文件：
   - 主配置：`.claude/settings.json`
   - 本地配置：`.claude/settings.local.json`

2. 检查是否有其他配置文件覆盖：
   - 用户主目录配置
   - 工作区配置

3. 检查 Claude Code 版本是否支持 hooks

4. 尝试将 hooks 配置直接写入 `.claude/settings.json`

---

**验证人**: 技术负责人  
**验证时间**: 2026-04-12T00:00:00Z  
**状态**: 配置已更新，等待新会话验证

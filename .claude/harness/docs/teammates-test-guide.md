# Teammates 配置测试指南

## 修复内容

本次修复了以下配置问题：

### 1. team.json 配置修复

**文件位置**：`.claude/harness/team.json`

**修改内容**：
```json
"teammates": {
  "enabled": true,
  "autoSpawnSubagents": true,  // 从 false 改为 true
  ...
  "spawnTrigger": {             // 新增配置
    "keywords": ["并行", "多任务", "spawn", "Agent 协作"],
    "autoDetectTaskComplexity": true
  }
}
```

### 2. settings.json 配置修复

**文件位置**：`.claude/settings.json`

**修改内容**：
在 `SessionStart` hooks 数组中添加 teammates-hook 调用：
```json
{
  "type": "command",
  "command": "node -e \"...tsx hooks/teammates-hook.ts\"",
  "timeout": 30,
  "statusMessage": "Running teammates check...",
  "runInBackground": true
}
```

### 3. teammates-hook.ts 修复

**文件位置**：`.claude/harness/hooks/teammates-hook.ts`

**修改内容**：
- 添加 `findProjectRoot()` 函数，正确查找项目根目录
- 添加 `analyzeTaskForSpawn()` 函数，分析任务复杂度
- 添加 `writeSpawnSuggestion()` 函数，写入 spawn 建议文件

---

## 测试步骤

### 步骤 1：打开新会话

关闭当前会话，打开新的 Claude Code 会话。

### 步骤 2：观察 SessionStart 输出

新会话开始时，你应该看到：

```
Running session start check...
Running teammates check...
```

### 步骤 3：检查 teammates 状态

Teammates hook 应该输出类似：

```
✅ Teammates 检查通过 - 当前 0/3 个 Agent

警告:
⚠️ 建议 spawn 2 个 Agent 处理任务
```

### 步骤 4：检查 spawn 建议文件

查看文件：`.claude/harness/output/spawn-suggestion.json`

内容应该包含建议 spawn 的 Agent 列表：
```json
[
  {
    "name": "Dev-Agent",
    "task": "并行开发独立页面模块",
    "reason": "检测到 32 个待办任务，建议 spawn Dev-Agent 并行处理"
  },
  {
    "name": "QA-Agent",
    "task": "代码审查和质量检查",
    "reason": "检测到需要代码审查的任务"
  }
]
```

---

## 预期行为

### 自动 spawn 模式

当 `autoSpawnSubagents: true` 时：
- 会话开始时自动检测任务复杂度
- 如果待办任务 > 10 个，建议 spawn Dev-Agent
- 如果任务包含"审查"关键词，建议 spawn QA-Agent
- 最多 spawn 3 个 Agent（maxConcurrentTeammates）

### 手动 spawn 模式

主 Agent 可以手动 spawn 子 Agent：
```
Agent({
  description: "开发浏览页",
  subagent_type: "Dev-Agent-1",
  prompt: "负责开发浏览页面模块..."
})
```

---

## 验证清单

- [ ] team.json 中 `autoSpawnSubagents` 为 `true`
- [ ] settings.json 中 SessionStart 包含 teammates-hook
- [ ] teammates-hook.ts 使用 `findProjectRoot()` 查找项目
- [ ] 新会话启动时显示 "Running teammates check..."
- [ ] teammates hook 输出建议 spawn 的 Agent 信息
- [ ] spawn-suggestion.json 文件被创建

---

## 故障排查

### 问题：看不到 teammates check 输出

**原因**：settings.json 配置未生效

**解决**：
1. 检查 `.claude/settings.json` 是否正确保存
2. 重启 VSCode
3. 检查 Claude Code 扩展是否最新版本

### 问题：teammates hook 报错找不到 team.json

**原因**：路径查找逻辑错误

**解决**：
1. 确认 teammates-hook.ts 包含 `findProjectRoot()` 函数
2. 确认项目根目录存在 `TASK.md` 文件

### 问题：没有 spawn 建议输出

**原因**：任务待办数量不足或配置未启用

**解决**：
1. 检查 team.json 中 `teammates.enabled` 是否为 `true`
2. 检查 `autoDetectTaskComplexity` 是否为 `true`
3. 确认 TASK.md 中有足够的待办任务（> 10 个）

---

## 团队成员配置

当前团队成员：
| 成员 | 角色 | 职责 |
|------|------|------|
| 张三 | lead | 任务分配、代码审查 |
| 李四 | developer | 前端开发（uni-app） |
| 王五 | reviewer | 质量审查 |
| PM-Agent | pm | 项目管理 |
| Dev-Agent-1 | developer | 前端开发智能体 |
| Dev-Agent-2 | developer | 后端开发智能体 |
| QA-Agent | reviewer | 质量审查智能体 |

---

**最后更新**：2026-04-09
**会话 ID**：session-20260409-001

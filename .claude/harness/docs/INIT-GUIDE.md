# Harness 项目初始化指南

**用途**：将手动复制的 `.claude` 目录初始化为干净的新项目环境

---

## 使用步骤

### 步骤 1: 手动复制 .claude 目录

```bash
# Windows (PowerShell 或 CMD)
xcopy /E /I source-project\.claude new-project\.claude

# 或者在文件资源管理器中直接复制粘贴
```

### 步骤 2: 运行初始化脚本

**Windows (批处理)**:
```bash
cd new-project\.claude\harness\scripts
init-project.bat
```

**Linux/Mac (Bash)**:
```bash
cd /path/to/new-project/.claude/harness/scripts
chmod +x init-project.sh
./init-project.sh
```

---

## 脚本执行内容

| 步骤 | 操作 | 说明 |
|------|------|------|
| 1 | 清理 agent-memory | 清空所有子代理记忆目录 |
| 2 | 清理 output | 删除旧的 Harness 输出文件 |
| 3 | 清理 analysis | 删除旧的任务分析文档 |
| 4 | 检查/创建 team.json | 如不存在则创建默认配置 |
| 5 | 安装依赖 | 使用 pnpm 或 npm 安装 |

---

## 初始化后检查

### 1. 验证目录结构

```bash
ls -la new-project/.claude/
# 应该看到：agent-memory/, harness/, settings.json
```

### 2. 验证记忆已清空

```bash
ls new-project/.claude/agent-memory/frontend-dev/
# 应该是空目录
```

### 3. 运行 Hook 测试

```bash
cd new-project/.claude/harness
pnpm start
```

---

## 项目隔离验证

```bash
# 源项目 - 有项目记忆
ls source-project/.claude/agent-memory/frontend-dev/
# 输出：项目相关的模式文件

# 新项目 - 空目录
ls new-project/.claude/agent-memory/frontend-dev/
# 输出：(空)
```

✅ **确认：两个项目的记忆完全隔离，不会相互污染**

---

## 后续配置

### 编辑团队配置 (team.json)

```json
{
  "members": [
    {"name": "PM-Agent", "role": "pm", "type": "agent"},
    {"name": "你的项目名称", "role": "developer", "type": "human"}
  ]
}
```

### 编辑项目任务 (TASK.md)

```markdown
---
assignee: 你的 Agent
status: in_progress
task: 项目任务描述
---
```

### 编辑项目指令 (CLAUDE.md)

```markdown
# CLAUDE.md

本项目使用 Harness 进行工作流程管理。
详细说明见：`.claude/harness/README.md`
```

---

## 常见问题

### Q: 初始化后可以恢复旧记忆吗？
A: 不可以。初始化会清空所有记忆，这是为了防止项目污染。

### Q: 可以部分保留记忆吗？
A: 不建议。每个项目应该有独立的记忆。如需共享知识，请使用文档。

### Q: 忘记运行初始化脚本怎么办？
A: 重新运行即可。脚本会清理所有项目特定数据。

---

## 脚本位置

| 文件 | 平台 | 路径 |
|------|------|------|
| `init-project.sh` | Linux/Mac | `.claude/harness/scripts/` |
| `init-project.bat` | Windows | `.claude/harness/scripts/` |

---

## 快速参考

```bash
# 完整流程示例
xcopy /E /I source-project\.claude new-project\.claude
cd new-project\.claude\harness\scripts
init-project.bat   # Windows
./init-project.sh  # Linux/Mac
```

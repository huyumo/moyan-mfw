# Harness 快速迁移指南

## 概述

本 Harness 验证环境已改造为**通用框架**，支持快速移植到任意开发项目。

---

## 移植步骤

### 步骤 1：复制 Harness 目录

将整个 `.claude/harness` 目录复制到目标项目：

```bash
# 源项目
cp -r .claude/harness /path/to/target/project/.claude/
```

或直接创建新文件：
- 复制所有 `hooks/*.ts` 文件
- 复制所有 `scripts/*.ts` 文件
- 复制 `package.json`、`tsconfig.json`、`config.json`

---

### 步骤 2：安装依赖

```bash
cd /path/to/target/project/.claude/harness
pnpm install
```

---

### 步骤 3：创建 settings.json

在项目根目录创建 `.claude/settings.json`：

```bash
touch .claude/settings.json
```

粘贴以下配置（**无需修改路径**，配置已支持动态路径）：

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const p=require('path');const c=process.cwd();const h=p.join(c,'.claude','harness');process.chdir(h);require('child_process').execSync('npx tsx hooks/session-start-hook.ts',{stdio:'inherit',cwd:h})\"",
            "timeout": 30,
            "statusMessage": "Running session start check..."
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const p=require('path');const c=process.cwd();const h=p.join(c,'.claude','harness');process.chdir(h);require('child_process').execSync('npx tsx hooks/pre-code-hook.ts',{stdio:'inherit',cwd:h})\"",
            "timeout": 30,
            "statusMessage": "Running pre-code check...",
            "once": true
          }
        ]
      },
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const p=require('path');const c=process.cwd();const h=p.join(c,'.claude','harness');process.chdir(h);require('child_process').execSync('npx tsx hooks/pre-code-hook.ts',{stdio:'inherit',cwd:h})\"",
            "timeout": 30,
            "statusMessage": "Running pre-code check...",
            "once": true
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const p=require('path');const c=process.cwd();const h=p.join(c,'.claude','harness');process.chdir(h);require('child_process').execSync('npx tsx hooks/code-quality-gate.ts',{stdio:'inherit',cwd:h})\"",
            "timeout": 120,
            "statusMessage": "Running code quality gate..."
          }
        ]
      },
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const p=require('path');const c=process.cwd();const h=p.join(c,'.claude','harness');process.chdir(h);require('child_process').execSync('npx tsx hooks/code-quality-gate.ts',{stdio:'inherit',cwd:h})\"",
            "timeout": 120,
            "statusMessage": "Running code quality gate..."
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const p=require('path');const c=process.cwd();const h=p.join(c,'.claude','harness');process.chdir(h);require('child_process').execSync('npx tsx hooks/session-end-hook.ts',{stdio:'inherit',cwd:h})\"",
            "timeout": 60,
            "statusMessage": "Running session end check..."
          }
        ]
      }
    ]
  }
}
```

---

### 步骤 4：创建 TASK.md

在项目根目录创建 `TASK.md`：

```markdown
---
task: 项目任务名称
status: pending
priority: P1
started: 2024-01-01
updated: 2024-01-01 00:00
session: session-001
---

## 当前目标
[一句话描述项目目标]

## 已完成
- [ ] 任务 1

## 进行中
- [ ] 任务 2

## 待开始
- [ ] 任务 3
```

---

### 步骤 5：验证安装

运行所有 hooks 验证：

```bash
cd .claude/harness
pnpm run verify
```

---

## 自定义配置

### 修改 Hook 触发条件

编辑 `.claude/settings.json`：

- `matcher: "*"` - 匹配所有事件
- `matcher: "Write"` - 仅匹配 Write 操作
- `matcher: "Edit"` - 仅匹配 Edit 操作
- `matcher: "Bash(*)"` - 匹配所有 Bash 命令

### 调整超时时间

```json
{
  "hooks": {
    "SessionStart": [{
      "timeout": 60  // 60 秒
    }]
  }
}
```

### 修改失败处理策略

在 `config.json` 中配置：

```json
{
  "hooks": {
    "session-start": {
      "onFailure": "block"   // block=阻塞，remind=提醒
    }
  }
}
```

---

## 常见问题

### Q1: Hook 执行失败，提示找不到文件

**检查**：
1. `.claude/harness` 目录是否存在
2. `package.json` 是否存在
3. 是否运行了 `pnpm install`

**解决**：
```bash
cd .claude/harness
pnpm install
```

---

### Q2: TypeScript 类型检查失败

**原因**：项目没有 TypeScript 配置或没有 typecheck 命令

**解决**：
1. 如果是 JavaScript 项目，在 `code-quality-gate.ts` 中移除 typecheck 检查
2. 或者添加 `pnpm run typecheck` 到项目 `package.json`

---

### Q3: 不想使用某个 Hook

**解决**：在 `settings.json` 中删除对应配置，或设置 `enabled: false`：

```json
{
  "hooks": {
    "PreToolUse": []  // 空数组禁用
  }
}
```

---

### Q4: 想要更简单的配置

使用简化版配置（仅会话开始和结束检查）：

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const p=require('path');const c=process.cwd();const h=p.join(c,'.claude','harness');process.chdir(h);require('child_process').execSync('npx tsx hooks/session-start-hook.ts',{stdio:'inherit',cwd:h})\"",
            "timeout": 30,
            "statusMessage": "Checking task..."
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const p=require('path');const c=process.cwd();const h=p.join(c,'.claude','harness');process.chdir(h);require('child_process').execSync('npx tsx hooks/session-end-hook.ts',{stdio:'inherit',cwd:h})\"",
            "timeout": 60,
            "statusMessage": "Checking session end..."
          }
        ]
      }
    ]
  }
}
```

---

## 支持的项目类型

| 项目类型 | 支持程度 | 说明 |
|----------|----------|------|
| TypeScript + pnpm | ✅ 完全支持 | 默认配置 |
| TypeScript + npm | ✅ 完全支持 | 自动检测 |
| TypeScript + yarn | ✅ 完全支持 | 自动检测 |
| TypeScript + bun | ✅ 完全支持 | 自动检测 |
| JavaScript | ⚠️ 部分支持 | 跳过 typecheck |
| Python | ⚠️ 部分支持 | 需自定义检查命令 |
| Go | ⚠️ 部分支持 | 需自定义检查命令 |
| Rust | ⚠️ 部分支持 | 需自定义检查命令 |

---

## 联系与反馈

如有问题或建议，请提交 Issue 或联系维护者。

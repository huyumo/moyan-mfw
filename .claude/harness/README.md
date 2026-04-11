# Claude Code Harness

通用项目级自动化 Hooks 执行引擎

## 什么是 Harness

Harness 是一个基于 Claude Code 的项目级自动化执行引擎，通过配置化的 Hooks 系统在开发流程的关键节点强制执行检查，确保代码质量和流程规范。

## 核心功能

### Hooks 检查系统

| Hook | 触发时机 | 检查内容 |
|------|---------|---------|
| `identity-greeting` | 会话启动 | 身份报告、开发模式确认 |
| `session-start` | 会话启动 | TASK.md 存在性和格式检查 |
| `task-analysis` | 任务分析前 | 需求理解、边界条件、技术方案 |
| `meeting-required` | 复杂任务 | 多 Agent 协作检查 |
| `pre-code` | 首次编码前 | 技术方案确认、影响分析 |
| `code-quality-gate` | 编码后 | 类型检查、自测报告、代码审查 |
| `session-end` | 会话结束 | 工作总结、任务更新、记忆保存 |

### 团队协作支持

- ✅ **会话锁机制**：防止多人同时编辑同一任务
- ✅ **任务指派人**：明确任务负责人（`assignee`）
- ✅ **审查者机制**：代码审查流程（`reviewers`）
- ✅ **任务分配规则检查**：强制 assignee 必须是团队成员
- ✅ **审查流程强制**：任务完成前需要审查记录

---

## 快速开始

### 步骤 1: 安装依赖

```bash
cd your-project/.claude/harness
pnpm install
```

### 步骤 2: 配置项目

```bash
# 复制配置模板
cp examples/config.example.json config.json
cp examples/team.example.json team.json
cp examples/settings.example.json ../../settings.json

# 编辑配置文件，修改项目名称和团队成员
```

### 步骤 3: 运行初始化

```bash
# Windows
cd scripts
init-project.bat

# Linux/Mac
cd scripts
chmod +x init-project.sh
./init-project.sh
```

### 步骤 4: 验证安装

```bash
cd ..
pnpm start
```

---

## 目录结构

```
harness/
├── config.json           # Harness 主配置
├── team.json             # 团队配置
├── package.json          # 依赖配置
├── tsconfig.json         # TypeScript 配置
├── start.bat / start.sh  # 快速启动脚本
├── hooks/                # Hook 脚本目录
│   ├── identity-greeting-hook.ts
│   ├── session-start-hook.ts
│   ├── task-analysis-hook.ts
│   ├── pre-code-hook.ts
│   ├── code-quality-gate.ts
│   └── session-end-hook.ts
├── scripts/              # 工具脚本
│   ├── init-project.sh/bat
│   ├── run-all-hooks.ts
│   └── pm-agent.ts
├── templates/            # 模板文件
│   ├── analysis-template.md
│   └── TASK-TEMPLATE.md
├── docs/                 # 文档目录
│   ├── FAQ.md
│   ├── INIT-GUIDE.md
│   └── TEAM-CONFIG.md
└── examples/             # 配置示例
    ├── config.example.json
    ├── team.example.json
    └── settings.example.json
```

---

## 配置说明

### config.json

```json
{
  "version": "1.0.0",
  "name": "Your Project Harness",
  "hooks": {
    "session-start": {
      "enabled": true,
      "timeout": 30000,
      "onFailure": "block"
    }
  },
  "rules": {
    "required-sections-before-code": [
      "需求理解",
      "边界条件",
      "技术方案",
      "风险评估"
    ]
  }
}
```

### team.json

```json
{
  "team": {
    "members": [
      {
        "id": "USER-001",
        "name": "技术负责人",
        "role": "lead",
        "isHuman": true
      },
      {
        "id": "PM-001",
        "name": "PM-Agent",
        "role": "pm",
        "isAgent": true
      }
    ]
  },
  "collaboration": {
    "codeReview": {
      "minReviewers": 2,
      "strictMode": true
    }
  }
}
```

---

## 运行 Hooks

### 运行单个 Hook

```bash
cd harness
pnpm run hook:identity
pnpm run hook:session-start
pnpm run hook:pre-code
pnpm run hook:code-quality
```

### 运行所有 Hooks

```bash
pnpm run run-all
```

---

## 文档

| 文档 | 说明 |
|------|------|
| [docs/FAQ.md](docs/FAQ.md) | 常见问题解答 |
| [docs/INIT-GUIDE.md](docs/INIT-GUIDE.md) | 初始化指南 |
| [docs/TEAM-CONFIG.md](docs/TEAM-CONFIG.md) | 团队配置说明 |
| [TEAMWORK.md](TEAMWORK.md) | 团队协作规范 |
| [MIGRATION.md](MIGRATION.md) | 迁移指南 |

---

## 自定义 Hooks

Hook 脚本位于 `hooks/` 目录，使用 TypeScript 编写：

```typescript
// hooks/custom-hook.ts
import { HarnessResult } from './types';

export async function runCustomHook(): Promise<HarnessResult> {
  // 自定义检查逻辑
  return {
    passed: true,
    message: '检查通过',
    data: {}
  };
}
```

在 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "hook:custom": "tsx hooks/custom-hook.ts"
  }
}
```

---

## 许可证

MIT License

---

**版本**: 1.0.0  
**维护**: Harness Team

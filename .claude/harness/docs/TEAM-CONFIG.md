# team.json 配置说明

## 配置概览

`team.json` 是 Harness 团队协作的核心配置文件，定义了团队成员、角色、协作规则和多 Agent 协作设置。

**支持两种模式**：
- **人工协作模式**：用户全程参与任务分配、审查等决策
- **自主协作模式**：用户仅在 Checkpoint 确认，中间过程由 AI 智能体自主完成

---

## 已实现的功能

| 功能模块 | 配置项 | 实现状态 | Hook 检查 |
|----------|--------|----------|----------|
| 团队成员检查 | `team.members` | ✅ 已实现 | `session-start-hook.ts` |
| 权限检查 | `team.roles.permissions` | ✅ 已实现 | `session-start-hook.ts` |
| 任务分配规则 | `collaboration.taskAssignment` | ✅ 已实现 | `session-start-hook.ts` |
| 并发任务限制 | `maxConcurrentTasks` | ✅ 已实现 | `session-start-hook.ts` |
| 审查流程强制 | `collaboration.codeReview` | ✅ 已实现 | `session-end-hook.ts` |
| 会话锁 | `collaboration.sessionLock` | ✅ 已实现 | `session-start-hook.ts` |
| Teammates 多 Agent | `teammates` | ✅ 已实现 | `teammates-hook.ts` |
| **PM Agent 自主协作** | `autonomousMode` | ✅ 已实现 | `pm-agent.ts` |
| 自动通知 | `notifications` | ❌ 暂不实现 | - |

---

## 配置结构

```json
{
  "version": "1.1.0",           // 配置版本
  "name": "团队配置",            // 配置名称
  "description": "...",         // 配置描述
  "currentUser": "张三",        // 当前用户
  "autonomousMode": { ... },    // 自主协作模式配置（新增）
  "team": { ... },              // 团队成员和角色定义
  "collaboration": { ... },     // 协作规则配置
  "notifications": { ... },     // 通知配置
  "teammates": { ... }          // 多 Agent 协作配置
}
```

---

## autonomousMode - 自主协作模式配置（新增）

### 配置说明

启用自主协作模式后，用户只需在关键节点确认，中间过程由 AI 智能体自主完成。

```json
"autonomousMode": {
  "enabled": true,              // 是否启用自主模式
  "pmAgent": "PM-001",          // PM Agent ID（项目负责人）
  "checkpoints": [              // 用户确认节点
    "requirement-confirmed",    // 需求确认
    "design-confirmed",         // 设计确认
    "delivery-ready"            // 交付确认
  ]
}
```

### Checkpoint 说明

| Checkpoint | 确认内容 | 确认后流程 |
|----------|--------|----------|
| `requirement-confirmed` | 需求理解、功能列表 | PM Agent 开始任务分解和技术设计 |
| `design-confirmed` | 技术方案、任务分解 | Dev-Agent 开始编码 |
| `delivery-ready` | 交付成果、测试结果 | 项目交付完成 |

### 角色配置

自主协作模式需要配置以下角色：

```json
"team": {
  "members": [
    {
      "id": "PM-001",
      "name": "PM-Agent",
      "role": "pm",           // PM 角色
      "skills": ["requirement-analysis", "task-planning", "coordination"],
      "description": "项目负责人（智能体）- 不参与编码"
    },
    {
      "id": "DEV-001",
      "name": "Dev-Agent-1",
      "role": "developer",
      "skills": ["frontend", "typescript"],
      "description": "前端开发智能体"
    },
    {
      "id": "QA-001",
      "name": "QA-Agent",
      "role": "reviewer",
      "skills": ["code-review", "testing"],
      "description": "质量审查智能体"
    }
  ]
}
```

### 运行 PM Agent

```bash
# 查看 PM Agent 状态
npx tsx scripts/pm-agent.ts

# 或在 harness 目录中
pnpm run pm-agent
```

详细文档：[AUTONOMOUS-MODE.md](AUTONOMOUS-MODE.md)

---

## team - 团队成员配置

### members 数组

定义团队的成员列表。

```json
"members": [
  {
    "id": "member-001",           // 唯一标识
    "name": "张三",               // 姓名（用于 assignee 检查）
    "email": "zhangsan@example.com",
    "role": "lead",               // 角色
    "skills": ["frontend", "typescript"],
    "active": true                // 是否活跃
  }
]
```

### roles 角色定义

定义各角色的权限（✅ 已实现权限检查）。

```json
"roles": {
  "lead": {
    "description": "技术负责人",
    "permissions": ["assign-task", "assign-self", "review-code", "merge-pr", "deploy"]
  },
  "developer": {
    "description": "开发工程师",
    "permissions": ["create-task", "assign-self", "submit-pr"]
  },
  "reviewer": {
    "description": "代码审查员",
    "permissions": ["review-code", "approve-pr"]
  }
}
```

### 权限说明

| 权限 | 说明 | 检查 Hook |
|------|------|----------|
| `assign-task` | 分配任务给他人 | `session-start-hook.ts` |
| `assign-self` | 领取任务给自己 | `session-start-hook.ts` |
| `create-task` | 创建新任务 | - |
| `review-code` | 审查代码 | - |
| `approve-pr` | 批准 PR | - |
| `merge-pr` | 合并 PR | - |
| `submit-pr` | 提交 PR | - |
| `deploy` | 部署权限 | - |

---

## collaboration - 协作规则

### taskAssignment 任务分配

```json
"taskAssignment": {
  "enabled": true,              // 是否启用任务分配检查
  "requireAssignee": true,      // 是否必须有 assignee
  "allowSelfAssign": true,      // 是否允许自分配
  "maxConcurrentTasks": 3       // 最大并发任务数（未实现）
}
```

**Hook 检查时机**：`session-start-hook.ts`

**检查规则**：
- `requireAssignee: true` → TASK.md 必须有 `assignee` 字段
- `assignee` 必须在 `team.members` 列表中

### codeReview 代码审查

```json
"codeReview": {
  "enabled": true,              // 是否启用审查检查
  "requireReviewBeforeMerge": true,  // 合并前是否需要审查
  "minReviewers": 1,            // 最少审查者数量
  "reviewerRoles": ["lead", "reviewer"],  // 有审查权限的角色
  "reviewStatus": {             // 审查状态定义（新增）
    "pending": "待审查",
    "revision_required": "需要修改（打回）",
    "approved": "已通过"
  }
}
```

**Hook 检查时机**：`session-end-hook.ts`

**检查规则**：
- `requireReviewBeforeMerge: true` → 任务完成前需要有审查记录
- 审查记录位置：`.claude/harness/output/code-review.md`
- **审查不通过时** → 任务不能结束，开发者需要修改后重新提交
- **有必须修复问题但未回复** → 阻塞，禁止会话结束

**审查流程**：
```
提交审查 → 审查中 → 通过 → 合并
              ↓
        需要修改（打回）
              ↓
         开发者修改
              ↓
         重新审查 → 通过 → 合并
```

详细说明：[CODE-REVIEW-FLOW.md](CODE-REVIEW-FLOW.md)

### sessionLock 会话锁

```json
"sessionLock": {
  "enabled": true,              // 是否启用会话锁
  "timeoutMinutes": 30,         // 锁超时时间（分钟）
  "notifyOnConflict": true,     // 冲突时是否通知（未实现）
  "allowForceTakeover": false   // 是否允许强制接管
}
```

**Hook 检查时机**：`session-start-hook.ts`

**检查规则**：
- 5 分钟内有其他会话 → 警告
- 超过 `timeoutMinutes` → 锁过期，可接管

---

## notifications - 通知配置（未实现）

```json
"notifications": {
  "enabled": false,
  "channels": {
    "taskAssigned": {
      "type": "email",
      "recipients": ["assignee"]
    },
    "codeReviewRequested": {
      "type": "email",
      "recipients": ["reviewers"]
    },
    "sessionConflict": {
      "type": "email",
      "recipients": ["all"]
    }
  }
}
```

---

## teammates - 多 Agent 协作配置（未实现）

```json
"teammates": {
  "enabled": true,
  "autoSpawnSubagents": false,
  "defaultModel": "claude-sonnet-4-6",
  "maxConcurrentTeammates": 3,
  "taskDistribution": {
    "strategy": "skill-based",   // skill-based 或 round-robin
    "fallback": "round-robin"
  }
}
```

---

## Hook 检查总结

| Hook | 检查的配置项 | 检查内容 |
|------|-------------|----------|
| `session-start-hook.ts` | `team.members` | assignee 是否是团队成员 |
| `session-start-hook.ts` | `collaboration.taskAssignment` | 是否需要 assignee |
| `session-start-hook.ts` | `collaboration.sessionLock` | 会话锁超时配置 |
| `session-end-hook.ts` | `collaboration.codeReview` | 是否需要审查记录 |

---

## 快速配置示例

### 最小配置（仅定义团队成员）

```json
{
  "team": {
    "members": [
      {
        "id": "001",
        "name": "张三",
        "role": "lead",
        "active": true
      }
    ]
  }
}
```

### 推荐配置（启用任务分配和审查）

```json
{
  "team": {
    "members": [
      {
        "id": "001",
        "name": "张三",
        "role": "lead",
        "active": true
      },
      {
        "id": "002",
        "name": "李四",
        "role": "developer",
        "active": true
      }
    ],
    "roles": {
      "lead": {
        "description": "技术负责人",
        "permissions": ["assign-task", "review-code"]
      },
      "developer": {
        "description": "开发工程师",
        "permissions": ["create-task", "submit-pr"]
      }
    }
  },
  "collaboration": {
    "taskAssignment": {
      "enabled": true,
      "requireAssignee": true,
      "allowSelfAssign": true
    },
    "codeReview": {
      "enabled": true,
      "requireReviewBeforeMerge": true
    },
    "sessionLock": {
      "enabled": true,
      "timeoutMinutes": 30
    }
  }
}
```

---

## 使用示例

### 示例 1：添加新成员

```json
// 编辑 team.json
{
  "team": {
    "members": [
      // ... 现有成员
      {
        "id": "003",
        "name": "赵六",
        "role": "developer",
        "skills": ["backend", "python"],
        "active": true
      }
    ]
  }
}
```

### 示例 2：禁用任务分配检查

```json
{
  "collaboration": {
    "taskAssignment": {
      "enabled": false  // 禁用检查
    }
  }
}
```

### 示例 3：修改会话锁超时

```json
{
  "collaboration": {
    "sessionLock": {
      "timeoutMinutes": 60  // 从 30 分钟改为 60 分钟
    }
  }
}
```

---

## 相关文件

- [TASK.md](../TASK.md) - 任务状态文件（assignee 字段检查）
- [COLLABORATION.md](../COLLABORATION.md) - 团队沟通日志
- [TEAMWORK.md](TEAMWORK.md) - 团队协作规范
- [code-review-template.md](templates/code-review-template.md) - 审查记录模板

# SubagentStart Hooks 配置指南

**文档版本**: 2026-04-10
**目的**: 为不同类型的 subagent 配置合适的启动 hooks，注入上下文和安全指南

---

## 📋 SubagentStart Hook 作用

**触发时机**: 当 subagent 被 `Agent` 工具调用时

**主要用途**:
1. 注入额外的上下文信息
2. 强调安全规范
3. 提供任务相关指南
4. 记录 subagent 启动日志

---

## 🤖 各 Subagent 的 Hooks 配置

### 1. Project-Manager（任务协调）

**职责**: 任务分配、进度跟踪、团队协调

**应触发的 Hook**:
```json
{
  "SubagentStart": [
    {
      "matcher": "project-manager",
      "hooks": [
        {
          "type": "command",
          "command": "cd .claude/harness && pnpm run hook:pm-context",
          "statusMessage": "📋 加载项目管理上下文...",
          "timeout": 30
        }
      ]
    }
  ]
}
```

**注入内容**:
- ✅ 当前 TASK.md 状态
- ✅ 活跃 teammates 列表
- ✅ 任务分配历史
- ✅ 团队协作规则

**示例 hook 脚本**: `hooks/pm-context-hook.ts`

```typescript
// 读取 TASK.md 和 team.json
// 输出当前任务状态和可用团队成员
// 提醒 PM-Agent 遵循协作流程
```

---

### 2. Tech-Architect（架构设计）

**职责**: 架构设计、技术选型、复杂问题解决

**应触发的 Hook**:
```json
{
  "SubagentStart": [
    {
      "matcher": "tech-architect",
      "hooks": [
        {
          "type": "command",
          "command": "cd .claude/harness && pnpm run hook:architect-context",
          "statusMessage": "🏗️ 加载架构设计上下文...",
          "timeout": 30
        }
      ]
    }
  ]
}
```

**注入内容**:
- ✅ 现有技术栈文档
- ✅ 架构决策记录 (ADR)
- ✅ 技术债务清单
- ✅ 性能和安全要求

---

### 3. Backend-TS-Node-Dev（后端开发）

**职责**: TypeScript/Node.js 后端开发

**应触发的 Hook**:
```json
{
  "SubagentStart": [
    {
      "matcher": "backend-ts-node-dev",
      "hooks": [
        {
          "type": "command",
          "command": "cd .claude/harness && pnpm run hook:backend-security",
          "statusMessage": "🔒 注入后端安全规范...",
          "timeout": 30
        }
      ]
    }
  ]
}
```

**注入内容**:
- ✅ **安全编码规范** (SQL 注入、XSS、CSRF 防护)
- ✅ API 设计规范 (RESTful、错误处理)
- ✅ 数据库访问规范 (参数化查询、事务处理)
- ✅ 日志和监控要求
- ✅ 测试覆盖率要求

**示例 hook 脚本**: `hooks/backend-security-hook.ts`

```typescript
/**
 * 后端开发安全规范注入
 */
export async function run(): Promise<HookResult> {
  return {
    passed: true,
    message: '后端安全规范已加载',
    data: {
      securityGuidelines: [
        '使用参数化查询防止 SQL 注入',
        '验证所有用户输入',
        '使用 bcrypt 哈希密码',
        '实现 JWT token 刷新机制',
        '记录所有敏感操作日志'
      ]
    }
  };
}
```

---

### 4. Frontend-Dev（前端开发）

**职责**: UI/UX、前端组件、样式

**应触发的 Hook**:
```json
{
  "SubagentStart": [
    {
      "matcher": "frontend-dev",
      "hooks": [
        {
          "type": "command",
          "command": "cd .claude/harness && pnpm run hook:frontend-guidelines",
          "statusMessage": "🎨 加载前端开发指南...",
          "timeout": 30
        }
      ]
    }
  ]
}
```

**注入内容**:
- ✅ **可访问性标准** (WCAG 2.1)
- ✅ 响应式设计规范
- ✅ 组件命名约定
- ✅ CSS/样式规范
- ✅ 性能优化建议 (Lazy loading、代码分割)

---

### 5. Code-Reviewer-Tester（代码审查）

**职责**: 代码质量审查、测试执行

**应触发的 Hook**:
```json
{
  "SubagentStart": [
    {
      "matcher": "code-reviewer-tester",
      "hooks": [
        {
          "type": "command",
          "command": "cd .claude/harness && pnpm run hook:review-checklist",
          "statusMessage": "📝 加载代码审查清单...",
          "timeout": 30
        }
      ]
    }
  ]
}
```

**注入内容**:
- ✅ **审查清单** (安全、性能、可维护性)
- ✅ 测试覆盖要求
- ✅ 常见漏洞检查项
- ✅ 代码风格指南

**示例审查清单**:
```markdown
## 安全检查
- [ ] 无硬编码凭证
- [ ] 输入验证完整
- [ ] 输出编码正确
- [ ] 无危险的 eval/exec 调用

## 性能检查
- [ ] 无 N+1 查询问题
- [ ] 适当的缓存策略
- [ ] 资源及时释放

## 可维护性检查
- [ ] 函数职责单一
- [ ] 变量命名清晰
- [ ] 错误处理完整
```

---

### 6. Docs-Architect（文档编写）

**职责**: 技术文档编写

**应触发的 Hook**:
```json
{
  "SubagentStart": [
    {
      "matcher": "docs-architect",
      "hooks": [
        {
          "type": "command",
          "command": "cd .claude/harness && pnpm run hook:docs-template",
          "statusMessage": "📄 加载文档模板...",
          "timeout": 30
        }
      ]
    }
  ]
}
```

**注入内容**:
- ✅ 文档模板 (API 文档、用户指南)
- ✅ 术语表
- ✅ 样式指南
- ✅ 版本控制规范

---

## 📋 完整的 SubagentStart 配置示例

```json
{
  "hooks": {
    "SubagentStart": [
      {
        "matcher": "project-manager",
        "hooks": [
          {
            "type": "command",
            "command": "pnpm run hook:pm-context",
            "statusMessage": "📋 加载项目管理上下文",
            "timeout": 30
          }
        ]
      },
      {
        "matcher": "tech-architect",
        "hooks": [
          {
            "type": "command",
            "command": "pnpm run hook:architect-context",
            "statusMessage": "🏗️ 加载架构设计上下文",
            "timeout": 30
          }
        ]
      },
      {
        "matcher": "backend-ts-node-dev",
        "hooks": [
          {
            "type": "command",
            "command": "pnpm run hook:backend-security",
            "statusMessage": "🔒 注入后端安全规范",
            "timeout": 30
          }
        ]
      },
      {
        "matcher": "frontend-dev",
        "hooks": [
          {
            "type": "command",
            "command": "pnpm run hook:frontend-guidelines",
            "statusMessage": "🎨 加载前端开发指南",
            "timeout": 30
          }
        ]
      },
      {
        "matcher": "code-reviewer-tester",
        "hooks": [
          {
            "type": "command",
            "command": "pnpm run hook:review-checklist",
            "statusMessage": "📝 加载代码审查清单",
            "timeout": 30
          }
        ]
      },
      {
        "matcher": "docs-architect",
        "hooks": [
          {
            "type": "command",
            "command": "pnpm run hook:docs-template",
            "statusMessage": "📄 加载文档模板",
            "timeout": 30
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "backend-ts-node-dev|frontend-dev|docs-architect",
        "hooks": [
          {
            "type": "command",
            "command": "pnpm run hook:subagent-review",
            "statusMessage": "🔔 审查 subagent 工作成果",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

---

## 🔄 Hook 触发时序图

```
用户请求："开发用户积分系统"
    │
    └─→ 主 Agent 分析任务
            │
            └─→ 调用 Agent 工具 (project-manager)
                    │
                    ├─→ SubagentStart: project-manager ✅
                    │       └─→ hook:pm-context
                    │               └─→ 加载 TASK.md、团队配置
                    │
                    ├─→ project-manager 执行任务分配
                    │
                    └─→ SubagentStop: project-manager
                            │
                            └─→ 记录任务分配结果
                                    
    └─→ project-manager 调用 backend-ts-node-dev
            │
            ├─→ SubagentStart: backend-ts-node-dev ✅
            │       └─→ hook:backend-security
            │               └─→ 注入安全规范
            │
            ├─→ backend-ts-node-dev 编写代码
            │       │
            │       └─→ Write/Edit (不会触发主 Agent 的 PostToolUse)
            │
            └─→ SubagentStop: backend-ts-node-dev ✅
                    └─→ hook:subagent-review
                            └─→ 审查代码质量和安全
```

---

## 📁 建议的 Hook 脚本结构

```
.claude/harness/hooks/
├── pm-context-hook.ts          # 项目管理上下文
├── architect-context-hook.ts   # 架构设计上下文
├── backend-security-hook.ts    # 后端安全规范
├── frontend-guidelines-hook.ts # 前端开发指南
├── review-checklist-hook.ts    # 代码审查清单
├── docs-template-hook.ts       # 文档模板
└── subagent-review-hook.ts     # Subagent 审查 (已创建)
```

---

## ⚠️ 注意事项

### SubagentStart vs SubagentStop

| Hook | 触发时机 | 主要用途 |
|------|----------|----------|
| `SubagentStart` | subagent **开始**时 | 注入上下文、指南 |
| `SubagentStop` | subagent **结束**时 | 审查输出、检查质量 |

### 为什么需要 SubagentStart？

1. **预防胜于治疗** - 在开始前注入规范，比事后审查更有效
2. **减少错误** - 提前告知安全要求，减少违规代码产生
3. **提高效率** - subagent 知道规范，减少返工

### Matcher 模式

```json
// 精确匹配
"matcher": "backend-ts-node-dev"

// 多个匹配（管道分隔）
"matcher": "backend-ts-node-dev|frontend-dev"

// 正则表达式
"matcher": ".*-dev"  // 匹配所有开发 agent
```

---

## 📚 相关文档

- [SubagentStop 配置](./SUBAGENT-HOOKS-CONFIG.md)
- [Subagent 权限配置](../../agents/SUBAGENT-PERMISSIONS.md)
- [主 Agent 使用指南](../../agents/MAIN-AGENT-GUIDE.md)

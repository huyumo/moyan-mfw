# 主 Agent 使用指南 - 协调员模式

> **重要**：主 agent 已被配置为 **仅协调模式**，不得参与任何代码编写工作。

---

## 🎯 主 Agent 职责

作为 **协调员 (Coordinator)**，你的核心职责是：

### ✅ 必须做的
1. **需求分析** - 理解用户需求，明确任务范围
2. **任务分解** - 将复杂任务拆分为可执行的子任务
3. **调用 Subagent** - 使用 `Agent` 工具调用专业 subagent 执行工作
4. **进度跟踪** - 监控各 subagent 的执行状态
5. **结果整合** - 汇总各 subagent 的输出并向用户报告
6. **质量把关** - 确保交付成果符合用户要求

### ❌ 禁止做的
1. **禁止编写业务代码** - 所有代码必须由 subagent 编写
2. **禁止修改项目文件** - 只能修改 `.claude/harness/` 目录
3. **禁止执行测试命令** - 测试工作由 `code-reviewer-tester` 完成

---

## 🔧 权限配置

### 允许的工具
| 工具 | 用途 | 限制 |
|------|------|------|
| `Read` | 读取文件 | 无限制 |
| `Grep` | 搜索内容 | 无限制 |
| `Glob` | 搜索文件 | 无限制 |
| `Bash` | 仅允许 `curl *` | 网络请求 |
| `WebFetch` | 获取网页 | 无限制 |
| `Agent` | 调用 subagent | **核心工具** |
| `Edit` | 编辑文件 | 仅限 `.claude/harness/**` |
| `Write` | 写入文件 | 仅限 `.claude/harness/**` |

### 禁止的工具
- `Edit(!.claude/harness/**)` - 禁止编辑项目代码
- `Write(!.claude/harness/**)` - 禁止写入项目代码
- `Bash(!curl *)` - 禁止执行其他 shell 命令

---

## 🤖 Subagents 列表

| Subagent | 职责 | 调用时机 | 工具权限 |
|----------|------|----------|----------|
| **tech-architect** | 架构设计 | 需要技术方案、架构设计时 | 只读 + Agent |
| **project-manager** | 任务分配 | 需要分配任务、跟踪进度时 | 只读 + Agent |
| **backend-ts-node-dev** | 后端开发 | 需要编写 TypeScript/Node.js 代码时 | 完整开发权限 |
| **frontend-dev** | 前端开发 | 需要编写前端代码时 | 完整开发权限 |
| **code-reviewer-tester** | 代码审查 | 代码完成后需要审查测试时 | 只读 + Bash |
| **docs-architect** | 文档编写 | 需要编写技术文档时 | 文档编辑权限 |

---

## 📋 调用 Subagent 的方法

### 方法 1：使用 Agent 工具（推荐）

调用 `Agent` 工具并指定 subagent 类型：

```
调用 Agent 工具：
- subagent_type: backend-ts-node-dev
- prompt: 创建用户认证 API，包含以下功能：
  1. 用户注册（邮箱、密码）
  2. 用户登录（返回 JWT token）
  3. Token 刷新
  4. 密码重置
```

### 方法 2：自然语言调用

在对话中直接提及 subagent 名称：

```
"让 backend-ts-node-dev 实现这个 API"
"请 tech-architect 设计数据库架构"
"frontend-dev，优化这个组件的性能"
"code-reviewer-tester，审查刚才的代码"
```

### 方法 3：任务型自动匹配

根据任务描述，系统会自动匹配合适的 subagent：

| 用户输入关键词 | 自动匹配 subagent |
|----------------|------------------|
| "设计"、"架构"、"选型" | tech-architect |
| "分配"、"进度"、"任务" | project-manager |
| "API"、"后端"、"数据库" | backend-ts-node-dev |
| "UI"、"组件"、"样式"、"前端" | frontend-dev |
| "审查"、"测试"、"质量" | code-reviewer-tester |
| "文档"、"说明"、"README" | docs-architect |

---

## 🔄 完整工作流示例

### 示例 1：开发新功能

**用户：** "开发一个用户积分系统"

**主 Agent 正确做法：**

1. **分析需求**（不写代码）
   ```
   积分系统需要以下组件：
   - 数据库设计（积分表、流水表）
   - 后端 API（获取积分、增加积分、消费积分）
   - 前端展示（积分余额、积分明细）
   - 文档说明
   ```

2. **调用 subagents**
   ```
   步骤 1: 调用 tech-architect
   → 设计积分系统架构和数据库模型
   
   步骤 2: 调用 backend-ts-node-dev
   → 实现后端 API 和数据库操作
   
   步骤 3: 调用 frontend-dev
   → 实现前端展示组件
   
   步骤 4: 调用 code-reviewer-tester
   → 审查代码并运行测试
   
   步骤 5: 调用 docs-architect
   → 编写 API 文档和使用说明
   ```

3. **整合结果**
   ```
   ✅ 积分系统开发完成
   
   完成内容：
   - 数据库设计：3 张表（users, points, point_logs）
   - 后端 API: 5 个端点
   - 前端组件：积分卡片、明细列表
   - 测试覆盖率：85%
   
   相关文件：
   - src/api/points.ts
   - src/components/PointsCard.tsx
   - docs/points-api.md
   ```

---

### 示例 2：修复 Bug

**用户：** "登录接口返回 500 错误"

**主 Agent 正确做法：**

1. **调用 backend-ts-node-dev** 检查代码
2. **调用 code-reviewer-tester** 运行测试定位问题
3. **监督修复**（不亲手写代码）
4. **验证修复结果**

---

## ⚠️ 常见错误

### ❌ 错误：主 Agent 亲自写代码

```
用户："创建一个简单的加法函数"

错误做法：
"好的，我来写这个函数：
function add(a, b) { return a + b; }"
```

### ✅ 正确：调用 subagent

```
用户："创建一个简单的加法函数"

正确做法：
调用 Agent 工具：
- subagent_type: backend-ts-node-dev
- prompt: 创建一个工具函数，实现两个数相加
```

---

## 📁 配置文件

### 主权限配置
`.claude/settings.local.json`

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Grep",
      "Glob",
      "Bash(curl *)",
      "WebFetch",
      "Agent",
      "Edit(.claude/harness/**)",
      "Write(.claude/harness/**)"
    ],
    "deny": [
      "Edit(!.claude/harness/**)",
      "Write(!.claude/harness/**)"
    ]
  }
}
```

### Subagent 定义
`.claude/agents/` 目录

---

## 🔍 故障排查

### Q: Subagent 没有被调用？
**检查：**
1. 主 agent 是否有 `Agent` 工具权限
2. prompt 中是否明确提到 subagent 名称
3. subagent 文件是否存在于 `.claude/agents/`

### Q: Subagent 无法写入文件？
**检查：**
1. hooks 是否正常运行
2. TASK.md 状态是否为 `in_progress`
3. 是否通过了 pre-code 检查

### Q: 主 agent 意外写了代码？
**解决：**
1. 检查 `settings.local.json` 中的 deny 规则
2. 确保 deny 规则在 allow 规则之后生效
3. 重新强调主 agent 的协调员角色

---

## 📚 相关文档

- [SUBAGENT-GUIDE.md](./SUBAGENT-GUIDE.md) - Subagent 配置和使用指南
- [SUBAGENT-PERMISSIONS.md](./SUBAGENT-PERMISSIONS.md) - Subagent 权限配置详解
- [MAIN-AGENT-COORDINATOR.md](./MAIN-AGENT-COORDINATOR.md) - 主 Agent 职责说明

# 自主协作模式（Autonomous Mode）

## 模式说明

自主协作模式允许 AI 智能体在用户确认关键节点后，自主完成开发流程，无需人工干预中间过程。

---

## 工作流程

```
用户提出需求
     ↓
┌─────────────────────────────────────────┐
│  Checkpoint 1:需求确认（用户参与）        │
│  - PM Agent 分析需求                     │
│  - 与用户沟通确认核心需求                 │
│  - 用户确认：是 → 继续 / 否 → 重新分析   │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  PM Agent 自主工作                        │
│  - 任务分解                              │
│  - 技术方案设计                          │
│  - 任务分配（Dev-Agent、QA-Agent）       │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  Checkpoint 2:设计确认（用户参与）        │
│  - 展示技术方案                          │
│  - 用户确认：是 → 继续 / 否 → 重新设计   │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  Dev-Agent 自主开发                       │
│  - 编写代码                              │
│  - 自测                                  │
│  - 提交审查                              │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  QA-Agent 自主审查                        │
│  - 代码审查                              │
│  - 测试验证                              │
│  - 审查通过 → 合并 / 不通过 → 打回      │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│  Checkpoint 3:交付确认（用户参与）        │
│  - 展示交付结果                          │
│  - 用户验收：通过 → 结束 / 不通过 → 修改 │
└─────────────────────────────────────────┘
     ↓
交付完成
```

---

## 角色定义

### PM-Agent（项目负责人）
- **职责**：需求分析、任务分解、任务分配、进度管理、质量把关
- **权限**：assign-task, review-code, approve-pr, merge-pr, deploy, coordinate-team
- **特点**：不参与编码工作，专注于管理和协调

### Dev-Agent（开发智能体）
- **职责**：代码实现、自测、修复问题
- **权限**：create-task, assign-self, submit-pr
- **技能**：frontend/backend/typescript/go/python 等

### QA-Agent（质量审查智能体）
- **职责**：代码审查、测试验证、质量门禁
- **权限**：review-code, approve-pr
- **特点**：独立于开发，保证质量

---

## 配置说明

### team.json 配置

```json
{
  "autonomousMode": {
    "enabled": true,                    // 启用自主模式
    "pmAgent": "PM-001",                // PM Agent ID
    "checkpoints": [                    // 用户确认节点
      "requirement-confirmed",          // 需求确认
      "design-confirmed",               // 设计确认
      "delivery-ready"                  // 交付确认
    ]
  },
  "team": {
    "members": [
      {
        "id": "PM-001",
        "name": "PM-Agent",
        "role": "pm",
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
  },
  "collaboration": {
    "taskAssignment": {
      "autoAssignByPM": true           // PM Agent 自动分配任务
    },
    "codeReview": {
      "autoReviewByQA": true           // QA Agent 自动审查
    }
  }
}
```

---

## Checkpoint 详解

### Checkpoint 1: 需求确认

**PM Agent 输出**：
- 需求理解文档
- 核心功能列表
- 不涉及范围

**用户确认内容**：
- [ ] 需求理解是否正确
- [ ] 功能列表是否完整
- [ ] 是否有额外需求补充

**确认后流程**：PM Agent 开始任务分解和技术设计

---

### Checkpoint 2: 设计确认

**PM Agent 输出**：
- 技术方案文档
- 架构图/流程图（如需要）
- 文件影响分析
- 任务分解计划

**用户确认内容**：
- [ ] 技术方案是否合理
- [ ] 任务分解是否清晰
- [ ] 是否有其他考虑

**确认后流程**：Dev-Agent 开始编码，QA-Agent 准备审查

---

### Checkpoint 3: 交付确认

**PM Agent 输出**：
- 交付成果列表
- 测试结果报告
- 使用说明（如需要）

**用户确认内容**：
- [ ] 功能是否符合预期
- [ ] 质量是否达标
- [ ] 是否有需要修改的地方

**确认后流程**：项目交付完成

---

## 运行 PM Agent

```bash
# 查看当前 PM Agent 状态
npx tsx scripts/pm-agent.ts

# 或在 harness 目录中
pnpm run pm-agent
```

---

## 自主协作 vs 人工协作

| 模式 | 需求分析 | 任务分配 | 代码开发 | 代码审查 | 用户参与 |
|------|---------|---------|---------|---------|---------|
| 自主协作 | PM Agent | PM Agent 自动 | Dev-Agent | QA-Agent | 仅 Checkpoint |
| 人工协作 | 人工 | 人工 | 人工 | 人工 | 全程参与 |

---

## 启用/禁用自主模式

### 启用
```json
// team.json
{
  "autonomousMode": {
    "enabled": true
  }
}
```

### 禁用（回到人工协作模式）
```json
// team.json
{
  "autonomousMode": {
    "enabled": false
  }
}
```

---

## 异常处理

### 场景 1：Dev-Agent 遇到技术难题
- **处理**：PM Agent 协调其他 Dev-Agent 支援
- **用户参与**：不需要，PM Agent 自主协调

### 场景 2：QA-Agent 审查不通过
- **处理**：打回给 Dev-Agent 修改，重新审查
- **用户参与**：不需要，循环直到通过

### 场景 3：需求变更
- **处理**：回到 Checkpoint 1，重新确认需求
- **用户参与**：需要，用户提出变更

---

## 最佳实践

1. **清晰的需求描述**：用户提出需求时尽量详细，减少反复确认
2. **及时 Checkpoint 确认**：到达 Checkpoint 时及时确认，避免阻塞
3. **合理期望**：自主模式提升效率，但复杂需求仍需多次迭代

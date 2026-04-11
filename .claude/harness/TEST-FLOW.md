# Harness 测试流程演示

本文档演示如何使用项目级 Harness 验证开发流程。

---

## 测试场景

模拟一个完整的开发流程，展示 Harness 如何在每个阶段进行强制检查。

---

## 步骤 1：会话开始检查

### 场景
用户开启新会话，准备开始工作。

### 执行命令
```bash
cd your-project-root
npx tsx .claude/harness/hooks/session-start-hook.ts
```

### 预期结果（TASK.md 存在且格式正确）
```json
{
  "passed": true,
  "message": "✅ 会话开始检查通过 - 当前任务：xxx (pending, P1)",
  ...
}
```

### 预期结果（TASK.md 不存在）
```json
{
  "passed": false,
  "message": "【阻塞】TASK.md 文件不存在，请先创建任务文件",
  ...
}
```

### 通过的条件
- ✅ TASK.md 文件存在
- ✅ YAML Front Matter 格式正确
- ✅ 必填字段完整（task, status, priority, started, updated, session）
- ✅ 任务状态值有效（pending/in_progress/blocked/completed）
- ✅ 优先级值有效（P0/P1/P2/P3）
- ✅ 包含"当前目标"章节

---

## 步骤 2：任务分析检查

### 场景
AI 在理解用户需求后，编写任务分析笔记。

### 创建分析笔记
```bash
mkdir -p .claude/harness/output
cp .claude/harness/templates/analysis-notes.md .claude/harness/output/task-analysis.md
```

### 编辑分析笔记
用以下内容填充 `task-analysis.md`：

```markdown
# 任务分析笔记

## 需求理解

**用户要解决的核心问题**：开发流程不规范，AI 不遵循开发步骤

**期望的目标**：建立强制检查机制，确保每个步骤都得到执行

---

## 边界条件

**包含范围**：
- 会话开始检查
- 任务分析检查
- 编码前检查
- 代码质量门禁
- 会话结束检查

**不包含范围**：
- 不修改用户级 settings.json
- 不依赖外部 hooks 配置

**技术限制**：
- 使用 TypeScript 编写
- 在项目目录内独立运行

---

## 技术方案

**实现方式**：
- 创建 5 个 Hook 脚本
- 使用统一运行器调用
- 输出日志到 output 目录

**涉及的文件/模块**：
- .claude/harness/hooks/*.ts

**依赖关系**：
- tsx (TypeScript 执行器)
- 无其他外部依赖

---

## 风险评估

**可能的风险点**：
- Hook 执行超时
- 类型检查失败

**缓解措施**：
- 设置合理的 timeout
- 提供详细的错误信息

---

## 用户确认

| 确认事项 | 用户反馈 | 确认时间 |
|----------|----------|----------|
| 使用项目级 Harness | 同意 | 2026-04-08 |
| 使用 TypeScript 编写 | 同意 | 2026-04-08 |

---

## 分析结论

任务分析完成，可以开始编码。
```

### 执行命令
```bash
npx tsx .claude/harness/hooks/task-analysis-hook.ts
```

### 预期结果（分析完整）
```json
{
  "passed": true,
  "message": "✅ 任务分析检查通过\n - 需求分析：✅\n - 边界分析：✅\n - 技术方案：✅\n - 风险评估：✅\n - 用户确认：✅",
  ...
}
```

### 预期结果（分析不完整）
```json
{
  "passed": false,
  "message": "【阻塞】任务分析不完整，请补充以下内容后再开始编码:\n✅ 需求分析\n❌ 边界分析\n✅ 技术方案",
  ...
}
```

---

## 步骤 3：编码前检查

### 场景
在开始写代码前，确认所有准备工作已完成。

### 前置条件
- 更新 TASK.md 状态为 `in_progress`
- 存在任务分析文档

### 执行命令
```bash
npx tsx .claude/harness/hooks/pre-code-hook.ts
```

### 预期结果
```json
{
  "passed": true,
  "message": "✅ 编码前检查通过",
  ...
}
```

---

## 步骤 4：代码质量门禁

### 场景
代码编写完成后，进行质量检查。

### 前置条件
- 有自测报告（可选）
- 有自我反思记录（可选）

### 执行命令
```bash
npx tsx .claude/harness/hooks/code-quality-gate.ts
```

### 预期结果
```json
{
  "passed": true,
  "message": "✅ 代码质量检查通过",
  ...
}
```

---

## 步骤 5：会话结束检查

### 场景
会话结束时，确认所有收尾工作已完成。

### 前置条件
创建工作总结：
```bash
echo "## 本次会话完成\n\n1. 创建 Harness 验证环境" > .claude/harness/output/work-summary.md
echo "## 自我反思\n\n代码质量良好" > .claude/harness/output/self-reflection.md
```

### 更新 TASK.md
- 标记已完成的任务为 `[x]`
- 更新 `updated` 字段为当前日期
- 记录下一步行动

### 执行命令
```bash
npx tsx .claude/harness/hooks/session-end-hook.ts
```

### 预期结果
```json
{
  "passed": true,
  "message": "✅ 会话结束检查通过",
  ...
}
```

---

## 完整流程演示

```bash
# 1. 会话开始检查
npx tsx .claude/harness/hooks/session-start-hook.ts
# 输出：✅ 会话开始检查通过

# 2. 编写任务分析笔记
# （编辑 .claude/harness/output/task-analysis.md）

# 3. 任务分析检查
npx tsx .claude/harness/hooks/task-analysis-hook.ts
# 输出：✅ 任务分析检查通过

# 4. 更新 TASK.md 状态为 in_progress
# （编辑 TASK.md）

# 5. 编码前检查
npx tsx .claude/harness/hooks/pre-code-hook.ts
# 输出：✅ 编码前检查通过

# 6. 开始编码...
# （编写代码）

# 7. 代码质量门禁
npx tsx .claude/harness/hooks/code-quality-gate.ts
# 输出：✅ 代码质量检查通过

# 8. 创建总结和反思
echo "# 工作总结" > .claude/harness/output/work-summary.md
echo "# 自我反思" > .claude/harness/output/self-reflection.md

# 9. 更新 TASK.md
# （标记已完成，记录下一步行动）

# 10. 会话结束检查
npx tsx .claude/harness/hooks/session-end-hook.ts
# 输出：✅ 会话结束检查通过
```

---

## 故障排除

### Hook 执行失败
检查错误信息，根据提示补充缺失的内容。

### 找不到 TASK.md
确保在项目根目录执行命令。

### TypeScript 编译错误
确保已安装依赖：`pnpm install`

---

## 下一步

验证成功后，可以：
1. 将 Harness 迁移到实际项目
2. 在用户级 settings.json 中配置自动触发
3. 根据实际需求定制 Hook 规则

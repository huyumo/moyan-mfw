# 需求分析强制检查 - 改进说明

## 改进背景

用户反馈：之前实现功能时没有充分分析优缺点、边界条件、实现思路和文件影响，就直接开始实现了。

**问题**：缺少强制的需求分析检查机制

**解决**：在 PreCode Hook 中添加需求分析完整性检查

---

## 改进内容

### 1. 增强 PreCode Hook

**文件**：`.claude/harness/hooks/pre-code-hook.ts`

**新增检查项**：

| 检查项 | 说明 | 关键词检测 |
|--------|------|------------|
| 需求理解 | 用户的核心需求是什么 | `需求理解`、`核心需求`、`用户需要` |
| 优缺点分析 | 方案的优点和缺点 | `优点 `、` 缺点`、` 权衡 `、` 利弊` |
| 边界条件分析 | 能做什么、不能做什么 | `边界`、` 限制 `、` 适用范围` |
| 实现思路 | 技术方案和步骤 | `实现`、` 方案 `、` 步骤` |
| 文件影响分析 | 会编辑/创建哪些文件 | `文件 `、` 编辑`、` 创建`、` 涉及` |

**检查逻辑**：
- 缺少任何一项 → **阻塞**，无法开始编码
- 有待确认事项 → **警告**，建议确认后继续

---

### 2. 创建分析模板

**文件**：`.claude/harness/templates/analysis-template.md`

**用途**：AI 每次分析需求时的标准模板

**章节**：
1. 需求理解
2. 优缺点分析（表格形式）
3. 边界条件（适用范围/不适用范围）
4. 实现思路（技术方案、步骤、替代方案）
5. 文件影响（会编辑/会创建/会删除）
6. 风险评估
7. 待确认事项
8. 用户确认

---

### 3. 更新文档

**文件**：`.claude/harness/README.md`

**更新内容**：
- 更新 pre-code hook 说明
- 添加新增检查项说明
- 添加模板文件引用

---

## 使用流程

```
用户提出需求
    │
    ▼
AI 输出需求分析（5 个必需章节）
    │
    ▼
用户确认分析结果
    │
    ▼
AI 开始编码
    │
    ▼
PreCode Hook 自动检查
    │
    ├── 检查通过 → 继续编码
    └── 检查失败 → 阻塞，提示补充分析
```

---

## 示例：AI 应该如何分析

### 用户说：
> 帮我添加团队协作功能到 Harness

### AI 应该先输出：

```markdown
## 需求理解
用户希望在 Harness 中添加团队协作功能，支持多人协作开发。

## 优缺点分析
### 优点
- 支持多人同时工作
- 明确任务责任
- 提高代码质量

### 缺点
- 增加配置复杂度
- 需要额外的协调成本

## 边界条件
### 支持的
- 任务分配
- 会话锁机制
- 代码审查流程

### 不支持的
- 实时协作编辑
- 多人语音会议

## 实现思路
1. 创建 team.json 配置文件
2. 增强 session-start-hook 支持团队检查
3. 添加 TEAMWORK.md 文档

## 文件影响
### 会编辑
- .claude/harness/hooks/session-start-hook.ts
- .claude/harness/README.md

### 会创建
- .claude/harness/team.json
- .claude/harness/TEAMWORK.md
- .claude/harness/templates/analysis-template.md
```

### 然后 PreCode Hook 检查 → 通过 → 开始编码

---

## Hook 检查示例

### 通过示例

```
✅ 编码前检查通过
 - 需求理解：✅
 - 优缺点分析：✅
 - 边界条件：✅
 - 实现思路：✅
 - 文件影响：✅
```

### 失败示例

```
❌ 编码前检查失败:
需求分析不完整，缺少以下内容：
  ❌ 优缺点分析
  ❌ 边界条件分析
  ❌ 实现思路

请先补充分析后再开始编码。
```

---

## 配置选项

在 `config.json` 中可配置：

```json
{
  "hooks": {
    "pre-code": {
      "enabled": true,
      "requiredSections": [
        "需求理解",
        "优缺点分析",
        "边界条件分析",
        "实现思路",
        "文件影响分析"
      ],
      "onFailure": "block"
    }
  }
}
```

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `.claude/harness/hooks/pre-code-hook.ts` | 增强的编码前检查 Hook |
| `.claude/harness/templates/analysis-template.md` | 需求分析模板 |
| `.claude/harness/README.md` | 更新的使用说明 |
| `.claude/harness/docs/analysis-requirements.md` | 分析要求详细说明 |

---

## 运行测试

```bash
# 从项目根目录运行
cd your-project-root
npx tsx .claude/harness/hooks/pre-code-hook.ts

# 或使用 pnpm
cd .claude/harness
pnpm run hook:pre-code
```

---

## 后续改进建议

1. **自动保存分析**：每次对话 AI 自动将分析保存到 `output/analysis-[timestamp].md`
2. **分析质量评分**：使用 LLM 评估分析质量
3. **历史分析回顾**：定期回顾分析准确性和完整性
4. **可配置检查严格度**：P0 紧急任务可简化检查

---

## 总结

**核心改进**：每次 AI 实现需求前，必须先输出完整的分析（优缺点、边界条件、实现思路、文件影响），PreCode Hook 会强制检查这些内容是否存在。

**目的**：确保 AI 充分思考后再开始实现，减少返工和遗漏。

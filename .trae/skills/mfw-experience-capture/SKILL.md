---
name: "mfw-experience-capture"
description: "Use when you encounter bugs, find solutions, make architectural decisions, or learn important lessons during moyan-mfw development. Captures experiences as training data for the project's AI model."
---

# 开发经验捕获

## 何时捕获

在以下场景中，**MUST** 捕获经验到训练数据：

| 场景 | 触发条件 | 捕获类型 |
|------|---------|---------|
| Bug 修复 | 解决了一个非显而易见的 bug | `exp:bug` |
| 经验教训 | 发现了一个框架的正确/错误用法 | `exp:lesson` |
| 架构决策 | 做出了一个技术选型或设计决策 | `exp:decision` |
| 自由问答 | 其他有价值的框架知识 | `exp:qa` |

## 捕获命令

```bash
cd scripts/training-data

# Bug 修复经验
pnpm exp:bug "问题描述" "根本原因" "修复方法" "预防措施(可选)"

# 经验教训
pnpm exp:lesson "场景" "教训" "正确做法" "错误做法(可选)"

# 架构决策
pnpm exp:decision "决策内容" "背景" "原因" "备选方案(可选)"

# 自由格式 Q&A
pnpm exp:qa "问题" "回答" "类别(可选)"

# 查看已捕获经验
pnpm exp:list
```

## 捕获规则

1. **问题必须自包含** — 不依赖上下文即可理解
2. **回答必须准确** — 引用实际框架 API，不要模糊描述
3. **代码用英文，描述用中文** — 与现有训练数据一致
4. **每条经验独立成条** — 不要把多个知识点混在一条里
5. **Bug 修复必须包含根本原因** — 不只记录症状和修复
6. **经验教训必须包含正确做法和错误做法** — 对比学习效果更好

## 数据存储

经验按周存储在 `data/dev-experiences/` 目录：
- `week-2026-W18.jsonl` — 第 18 周的经验
- `week-2026-W19.jsonl` — 第 19 周的经验
- `capture.log` — 捕获日志

## 数据流

```
AI 开发过程
  ↓ 遇到 bug / 发现经验 / 做出决策
  ↓
capture.ts → data/dev-experiences/week-*.jsonl
  ↓ 每周运行 pnpm extract
  ↓
index.ts 合并 → output/all-train.jsonl
  ↓
MiniMind SFT 训练
```

## 捕获示例

### Bug 修复

```bash
pnpm exp:bug "MfwListPage 的 loadData 不触发搜索" \
  "searchTrigger 默认为 'submit'，需要手动改为 'change' 才能在输入时自动搜索" \
  "设置 searchTrigger='change'，或在 searchTemplate 中给需要即时搜索的字段设置 immediate: true" \
  "创建搜索面板时，明确确认 searchTrigger 的预期行为"
```

### 经验教训

```bash
pnpm exp:lesson "在 Controller 中获取用户信息" \
  "不要使用 @Request() req.user，应该使用 @User() 装饰器" \
  "@User() user: UserDto 或 @User('id') userId: string" \
  "@Request() req 然后 req.user.id — 违反编码规范，ESLint 会报错"
```

### 架构决策

```bash
pnpm exp:decision "使用位运算而非字符串枚举实现权限系统" \
  "需要支持细粒度权限组合（如同时拥有添加+编辑权限），且需要高效查询" \
  "位运算支持 O(1) 权限检查，BigInt 支持无限扩展，且前后端统一计算逻辑" \
  "字符串枚举方案 — 查询需要 JOIN，性能差；JSON 数组方案 — 无法高效索引"
```

## 完成任务后检查

每次完成一个开发任务后，问自己：

1. 这次任务中是否遇到了 bug？→ `exp:bug`
2. 是否发现了框架的正确/错误用法？→ `exp:lesson`
3. 是否做出了技术选型或设计决策？→ `exp:decision`
4. 是否有其他值得记录的知识？→ `exp:qa`

**至少捕获一条经验**，持续积累训练数据。

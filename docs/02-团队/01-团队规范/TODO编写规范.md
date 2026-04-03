# TODO 编写规范

> 本规范强制执行，未按规范编写的 TODO 将被视为代码缺陷。

---

## 禁止的 TODO 写法

```typescript
// ❌ 禁止：无任务编号
// TODO: 实现路由同步功能

// ❌ 禁止：描述不清
// TODO: fix this

// ❌ 禁止：未实现标记
// TODO: 实现
// 待实现
// 开发中

// ❌ 禁止：硬编码说明
// 暂时使用模拟数据，后续替换
```

---

## 规范的 TODO 写法

### 必须包含
1. **任务编号**：关联的任务 ID
2. **描述**：具体要做什么
3. **预计完成时间**：什么时候完成
4. **阻塞原因**（如有）：为什么现在不能做

### 格式

```typescript
// TODO-[任务编号]: [描述]
// 预计完成：[日期]
// 阻塞原因：[原因]（如有）
```

---

## 示例

### 示例 1：普通 TODO
```typescript
// TODO-TASK-2026-04-03-001: 实现路由同步功能
// 预计完成：2026-04-05
// 阻塞原因：等待后端 API 接口文档
```

### 示例 2：Bug 修复 TODO
```typescript
// TODO-TASK-2026-04-03-002: 修复权限树渲染性能问题
// 预计完成：2026-04-04
```

### 示例 3：优化类 TODO
```typescript
// TODO-TASK-2026-04-03-003: 优化表格大数据渲染
// 预计完成：2026-04-10
// 阻塞原因：需要等用户反馈数据量情况
```

---

## 自动化检查

pre-commit 钩子会自动检查：

```bash
# 禁止的模式
grep -r "TODO[^(\-)]" --include="*.ts" --include="*.tsx" --include="*.vue" src/

# 允许的格式
grep -r "TODO-TASK-[0-9]" --include="*.ts" --include="*.tsx" --include="*.vue" src/
```

**违规的 TODO 将导致提交失败。**

---

## 任务编号规则

| 格式 | 示例 | 说明 |
|------|------|------|
| `TASK-YYYY-MM-DD-NNN` | `TASK-2026-04-03-001` | 项目任务 |
| `BUG-YYYY-MM-DD-NNN` | `BUG-2026-04-03-001` | Bug 修复 |
| `OPT-YYYY-MM-DD-NNN` | `OPT-2026-04-03-001` | 优化项 |

---

## 特殊情况

### 紧急但不重要的 TODO
如果必须在提交时保留 TODO：

```typescript
// TODO-TASK-2026-04-03-999: 清理调试代码
// 预计完成：下一个 commit
// 紧急程度：高
// 说明：调试代码，必须在合并前清理
```

### 遗留代码的 TODO
对于遗留代码中的 TODO：

```typescript
// TODO-LEGACY: [原TODO内容]
// 发现时间：2026-04-03
// 建议：在重构模块时一并处理
```

---

## 清理 TODO 的流程

```
1. 完成功能
   ↓
2. 删除对应的 TODO 注释
   ↓
3. 提交代码（pre-commit 会检查）
   ↓
4. 在任务文档中标记完成
```

---

## 违规处理

| 违规类型 | 处理方式 |
|----------|----------|
| 无任务编号的 TODO | 提交失败，要求修正 |
| 描述不清的 TODO | 代码审查时要求补充 |
| 逾期 TODO | PM 跟进，创建新任务或删除 |

---

## 工具支持

### VS Code 插件推荐
- **Todo Tree**: 可视化 TODO
- **TODO Highlight**: 高亮 TODO

### 搜索命令
```bash
# 查找所有 TODO
grep -r "TODO" --include="*.ts" --include="*.tsx" --include="*.vue" src/

# 查找无任务编号的 TODO
grep -r "TODO[^(\-)]" --include="*.ts" --include="*.tsx" --include="*.vue" src/

# 查找逾期 TODO（需配合日期解析）
grep -r "TODO-TASK" --include="*.ts" --include="*.tsx" --include="*.vue" src/ | grep "预计完成"
```


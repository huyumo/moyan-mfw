# 会话记录模板

> 每次会话结束后填写此模板，存档到 `.claude/sessions/` 目录

---

## 会话信息

- **会话 ID**：`session-YYYYMMDD-001`
- **日期**：`YYYY-MM-DD HH:mm`
- **参与者**：`@name`
- **任务**：`[TASK.md](../TASK.md) 中的任务名称`

---

## 本次会话完成的工作

1. [工作项 1]
2. [工作项 2]
3. [工作项 3]

---

## 关键决策

| 决策 | 原因 | 影响 |
|------|------|------|
| | | |

---

## 遇到的问题

| 问题 | 解决方案 | 备注 |
|------|----------|------|
| | | |

---

## 文件变更

### 编辑的文件
- `path/to/file.ts` - 修改说明

### 创建的文件
- `path/to/new/file.ts` - 用途说明

### 删除的文件
- `path/to/old/file.ts` - 原因

---

## 待跟进事项

- [ ] 需要审查的文件
- [ ] 需要测试的功能
- [ ] 需要补充的文档

---

## 交接信息（如有）

**交接给**：@name

**当前状态**：
- 已完成：...
- 进行中：...
- 阻塞点：...

---

## 会话耗时

- 开始时间：`HH:mm`
- 结束时间：`HH:mm`
- 总耗时：`X 小时 Y 分钟`

---

## 归档

**归档位置**：`.claude/sessions/session-YYYYMMDD-XXX.md`

**归档时间**：会话结束时自动归档

---

## 使用说明

### 会话开始时

1. 复制此模板
2. 填写会话信息
3. 开始工作

### 会话结束时

1. 填写完成的工作
2. 记录关键决策
3. 列出文件变更
4. 填写待跟进事项
5. 保存到 `.claude/sessions/` 目录

### 自动化（推荐）

在 `session-end-hook.ts` 中添加：

```typescript
// 会话结束时自动创建记录
const sessionFile = path.join(outputDir, `session-${sessionId}.md`);
fs.writeFileSync(sessionFile, generateSessionReport());
```

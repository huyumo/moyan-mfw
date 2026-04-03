---
name: 质量门禁强制规则
description: 任务执行和代码编写的门禁检查规则
type: feedback
---

**规则 1：任务状态管理门禁**

1. **任务开始前**：必须先更新 `TASK.md`
   - 标记任务状态为 `in_progress`
   - 记录当前子任务/步骤
   - 更新 `updated` 和 `lock` 字段

2. **任务结束时**：必须立即更新任务状态
   - 标记任务为 `[x]` 已完成
   - 记录完成时间和成果

3. **所有任务完成后**：必须执行归档
   - 创建 TASK.md 快照至 `docs/04-项目实施/05-任务追踪/archived/`
   - 重置 `TASK.md` 等待新任务
   - 归档后 TASK.md 只保留最近 3 条历史归档链接

4. **归档检查脚本**：`pnpm run gate:task-archive`
   - 自动检查 TASK.md 是否还有待处理任务
   - 如无待处理任务，自动执行归档并重置

**如何应用**：每次会话开始/结束、任务状态变更时强制检查。

---

**规则 2：代码类型验证门禁**

1. **编写 TypeScript/Vue 代码时**：必须实时验证类型
   - 文件类型：`.ts`, `.tsx`, `.vue`
   - 验证命令：`pnpm run typecheck` 或 `pnpm run typecheck:vue`

2. **开发完成后立即验证**：
   - 代码编写完成 → 立即运行类型检查
   - 发现错误 → 立即修复
   - 类型检查通过 → 才能提交

**如何应用**：每次修改代码文件后、Git 提交前强制检查。

---

**规则 3：门禁脚本命名规范**

- 所有门禁脚本、测试脚本使用 `.spec.ts` 后缀
- 位置：`scripts/` 目录下
- 示例：
  - `task-archive-gate.spec.ts` - 任务归档门禁
  - `validate-doc-links.spec.ts` - 文档链接验证
  - `validate-types.spec.ts` - 类型定义验证

**如何应用**：创建新门禁或测试脚本时，必须使用 `.spec.ts` 后缀。

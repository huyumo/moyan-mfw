# MFW 指南强制规则

编写任何代码前，**必须** `Skill(name="mfw-guide")` 加载指南，根据任务类型 `Read` 对应子文件。禁止凭记忆编码。
完成后自检：反模式、命名、`@fileoverview` + `@description`。

## 关键反模式

- ✋ `createQueryRunner() + try/catch` → `dataSource.transaction(callback)`
- ✋ `repository.find()` 分页 → `PaginationX + WhereBuilder`
- ✋ 表单 `emit('confirm')` → `defineExpose({ onConfirm })`
- ✋ 弹窗组件放 `views/` → `components/`
- ✋ 内联 `const STATUS = {…}` → `moyan-shared-dict`
- ✋ `@Request() req` → `@User() user: UserDto`
- ✋ 删除 API 缺 `{ hintSuccess: true }` / 缺 `ElMessageBox.confirm`
- ✋ 硬编码密钥到代码

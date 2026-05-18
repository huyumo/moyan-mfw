# 07 · 常见反模式

## 通用

| 反模式 | 正确做法 |
|--------|----------|
| ✋ 手动修改 `apis/` 目录 | 修改后端代码 → `pnpm run api:build` |
| ✋ 文件缺少 `@fileoverview` + `@description` | 每个 `.ts`/`.vue` 文件必须包含 |
| ✋ 硬编码密钥到代码 | 使用环境变量 `.env` |
| ✋ PnP/缓存导致构建异常 | 先 `pnpm install` 再构建 |

---

## 后端

| 反模式 | 正确做法 |
|--------|----------|
| ✋ `createQueryRunner() + try/catch` | `dataSource.transaction(callback)` |
| ✋ `repository.find()` 做分页 | `PaginationX + WhereBuilder` |
| ✋ 手写 SQL 拼接 WHERE 条件 | `WhereBuilder` 参数化构建 |
| ✋ 使用 `@Request() req` 获取用户 | `@User() user: UserDto` |
| ✋ `@PrimaryGeneratedColumn()` 自增主键 | `@PrimaryGeneratedColumn('uuid')` |
| ✋ 硬删除 `repository.remove()` | `repository.softDelete()` |
| ✋ 单实体模块创建 `controller/` / `service/` 子目录 | 扁平放置 |
| ✋ CUD 操作缺少 `@AuditLog` | CUD 必须加 `@AuditLog` |
| ✋ CUD 操作缺少 `@RequirePermission` | CUD 必须加 `@RequirePermission` |
| ✋ 忘记在 Module 中注册新 Entity | `TypeOrmModule.forFeature([X])` |
| ✋ 响应不用 `ApiResponseUtil.success()` | 统一包装响应 |
| ✋ 新增模块后忘记 `pnpm run api:build` | 修改后端后必须重新生成前端 API |

---

## 前端

| 反模式 | 正确做法 |
|--------|----------|
| ✋ 表单组件用 `emit('confirm')` | `defineExpose({ onConfirm })` |
| ✋ 弹窗组件放 `views/` 目录 | 放 `components/` |
| ✋ 删除操作无 `ElMessageBox.confirm` | 必须二次确认，`catch` 后 `return` |
| ✋ API 删除无 `{ hintSuccess: true }` | 删除成功需提示用户 |
| ✋ 内联 `const STATUS = {...}` | 使用 Shared Dict |
| ✋ 硬编码 options 数组 | 使用 `toItems(Dict)` |
| ✋ 手动三元表达式判断状态 | 使用 `MfwDictFormat` |
| ✋ 组件注册名缺 `Mfw` 前缀 | 必须 `MfwXxx` 格式 |
| ✋ 常量未使用 `as const` | `const STATUS = {...} as const` |
| ✋ API 类型从 `apis/` 手动编写 | 自动生成，禁止修改 |
| ✋ 表单 `label-width` 用 `80px` | 中文标签最小 `100px` |

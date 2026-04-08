---
task: 权限池配置面板功能优化
status: completed
priority: P1
started: 2026-04-08
updated: 2026-04-08 22:00
session: session-20260408-120000
lock: 1744142400
assignee: @ai
---

## 当前目标

优化权限池配置面板，解决按钮冲突、Tree 展示和权限值配置问题。✅ 已完成

## 已完成

### BigInt 类型混合错误修复 ✅
- [x] 修复 app-type.service.ts 中 sortOrder 排序时 BigInt 与 Number 混合运算错误
- [x] 使用 Number() 显式转换后再进行减法运算
- [x] 验证 API /api/app-types 返回正常

### 权限池配置弹窗重构 ✅
- [x] 创建 PermissionPoolDialog 独立弹窗组件
- [x] 创建模块导出文件 mod.ts
- [x] 重构 DetailPopup.vue 移除 Tabs 结构
- [x] 添加操作按钮打开独立弹窗
- [x] 修复 TypeScript 类型错误

### TypeScript 错误修复 ✅
- [x] 移除未使用的 ref 导入
- [x] 移除未使用的 handlePermissionPoolSaved 函数
- [x] 移除无效的 on: { saved: ... } 事件监听器
- [x] 类型检查验证通过

### 权限池配置面板优化 ✅
- [x] 修复弹窗按钮冲突（移除面板自身的保存/重置按钮）
- [x] 优化 Tree 展示方式（点击 PAGE/TAG 节点打开 permissionValue 配置弹窗）
- [x] 修复权限池数据获取逻辑（只显示已配置的权限 inPool=true）
- [x] 创建 PermissionValuePoolPopup 组件用于配置权限池中的权限值
- [x] 类型检查验证通过

### appTypeId 参数传递错误修复 ✅
- [x] 修复 savePermissionPool 函数中 appTypeId 参数传递方式
- [x] 将 appTypeId 从 params 移动到 query（moyan-api 使用 query 替换 URL 路径参数）
- [x] 验证 PermissionValuePoolPopup.vue 中参数格式正确
- [x] 类型检查验证通过

## 验证结果

```bash
# 类型检查
pnpm typecheck:vue
✅ 无错误

# 后端编译
pnpm --filter moyan-base-backend build
✅ webpack compiled successfully

# 服务启动
后端：http://localhost:3000 ✅
前端：http://localhost:5174 ✅
```

## 修改文件

| 文件 | 说明 |
|------|------|
| `packages/base-frontend/src/components/business/permission-pool-dialog/Index.vue` | 新建独立弹窗组件 |
| `packages/base-frontend/src/components/business/permission-pool-dialog/mod.ts` | 新建模块导出 |
| `packages/base-frontend/src/views/sys/app-type/DetailPopup.vue` | 重构移除 Tabs，使用独立弹窗 |
| `packages/base-frontend/src/components/picker/permission-pool-panel/Index.vue` | 优化 Tree 展示和权限值配置，修复 appTypeId 参数传递 |
| `packages/base-frontend/src/components/picker/permission-pool-panel/PermissionValuePoolPopup.vue` | 新建权限池权限值配置组件 |
| `packages/base-backend/src/modules/sys/app-type/app-type.service.ts` | 修复 BigInt 排序错误 |

## 下一步

权限池配置功能已修复完成，可正常使用。
- ✅ 修复 `appTypeId` 参数传递方式（从 `params` 改为 `query`）
- ✅ 类型检查通过
- ✅ 后端服务启动成功（http://localhost:3000）
- ✅ 前端服务启动成功（http://localhost:5174）

## 待修复问题（用户反馈）

### 问题 1：重复显示保存关闭按钮 ✅ 已修复
- **现象**：弹窗底部和面板底部都显示保存/重置按钮
- **原因**：PermissionPoolPanel 面板有底部按钮，PermissionPoolDialog 弹窗外层也有按钮
- **修复**：添加 `hideFooter` 属性，在 Dialog 模式中隐藏面板底部按钮

### 问题 2：保存后勾选状态重置 ✅ 已修复
- **现象**：选择权限后保存，所有勾选的权限节点全部重置为未选中
- **原因 1**：`handlePcTreeCheck` 函数使用 `actualCheckedKeys.includes(node.id)` 同步节点状态，但 ElTree 的 `checkedKeys` 只包含直接勾选的节点，不包含父节点勾选时的子节点
- **修复 1**：修改 `handlePcTreeCheck` 和 `handleNormalTreeCheck` 函数，使用递归方式传递 `parentChecked` 状态
- **原因 2**：`loadPermissionPool` 使用 `rawPcTree.value.filter(n => n.inPool)` 只过滤根节点，不会递归过滤子节点，导致返回空数组
- **修复 2**：添加 `collectCheckedKeys` 递归函数，收集所有 `inPool=true` 的节点 ID（包括子节点）

### 问题 3：编辑 permissionValue 后保存，权限池无法正确渲染 ✅ 已修复
- **现象**：在主界面勾选节点后，点击"配置操作权限"修改 permissionValue，保存后所有勾选状态丢失
- **原因**：`PermissionValuePoolPopup` 组件在 `onConfirm` 中获取 `currentPool`（数据库状态），然后提交整个树结构。这会覆盖主界面已勾选但还没保存的状态
- **修复**：
  1. `PermissionValuePoolPopup` 只返回 `{ nodeId, permissionValue }`，不提交整个树
  2. 主组件的 `confirm` 回调更新本地 `pcTreeData`/`normalTreeData` 中的 `permissionValueBigInt`
  3. 主组件调用 `savePermissionPool()` 统一保存所有修改

## 新增修改文件

| 文件 | 说明 |
|------|------|
| `packages/base-frontend/src/components/picker/permission-pool-panel/types.ts` | 添加 hideFooter 属性 |
| `packages/base-frontend/src/components/business/permission-pool-dialog/Index.vue` | 传递 hideFooter=true |
| `packages/base-frontend/src/components/picker/permission-pool-panel/Index.vue` | 支持 hideFooter，修复 checkedKeys 设置逻辑 |

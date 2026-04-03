---
task: 成员管理模块功能完善
description: 完善成员管理模块的前端表单和后端 API 联调
status: in_progress
priority: P1
started: 2026-04-03
updated: 2026-04-03 17:20
session: session-20260403-172000
lock: 1743685200
assignee: @pm
---

## 当前目标
完善成员管理模块，完成添加成员、角色分配功能，实现前后端联调

---

## 已完成
> 上期任务周期已完成，详见归档：[TASK-2026-04-03-1640](../../../docs/04-项目实施/05-任务追踪/archived/TASK-2026-04-03-1640.md)

- [x] 组件单元测试补充（91 个测试全部通过）
- [x] 强制自测试验证门禁建立

---

## 进行中（成员管理模块）

### Task 1: API 问题修复
- [x] 检查 Member Controller 接口完整性
- [ ] 修复 AddMemberForm.vue 参数传递（query → params）
- [ ] 修复 RoleAssignForm.vue 参数传递（query → params）
- [ ] 后端调整可选角色接口路径

### Task 2: 前后端联调
- [ ] 联调成员列表查询
- [ ] 联调添加成员功能
- [ ] 联调角色分配功能
- [ ] 联调移除成员功能

### Task 3: 自测试验证
- [ ] 类型检查通过
- [ ] 单元测试通过
- [ ] 项目启动验证
- [ ] 功能验证

---

## 待开始
- [ ] 角色管理模块完善
- [ ] 审计日志模块完善

---

## 相关文件
- 需求文档: `docs/01-业务需求/01-基础设施/05-页面设计/成员管理页面.md`
- 前端页面: `packages/base-frontend/src/views/sys/member/`
- 后端 API: `packages/base-backend/src/modules/sys/member/`
- API 接口文档: `docs/01-业务需求/01-基础设施/06-API 接口/成员接口.md`

---

## 发现的问题

### 1. AddMemberForm.vue 第 75-76 行
```typescript
// 错误
query: { appId: props.data!.appId },
params: { userId: form.userId },

// 正确
params: { appId: props.data!.appId, userId: form.userId }
```

### 2. RoleAssignForm.vue 第 73-78 行
同样错误，且类型断言 `as any`

### 3. 可选角色路径不一致
- 文档：`/apps/:appId/available-roles`
- 后端：`/apps/:appId/members/available-roles`

---

## 关键决策
- **开发顺序**: 成员管理 → 角色管理 → 审计日志
- **API 修复**: 遵循 apis 目录铁律，后端改 Swagger → 重新生成

---

## 变更记录
| 时间 | 变更类型 | 变更内容 | 原因 |
|------|----------|----------|------|
| 2026-04-03 17:20 | 新建任务 | 成员管理模块功能完善 | 方向3新功能开发确认 |

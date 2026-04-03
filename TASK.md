---
task: 组件库文档与测试补充
description: 编写组件库 API 文档、使用示例，补充单元测试提升覆盖率
status: pending
priority: P2
started: 2026-04-03
updated: 2026-04-03 09:35
session: session-20260403-093500
lock: 1743671700
assignee: @pm
---

## 当前目标
编写组件库 API 文档和使用示例，补充单元测试，目标覆盖率 80%

---

## 已完成
### 上期任务周期（2026-04-03 0301）
> 详见归档：[TASK-2026-04-03-0301](../../../docs/04-项目实施/05-任务追踪/archived/TASK-2026-04-03-0301.md)

- [x] SkillHub 与 desktop-control 安装
- [x] E2E 测试补充（3 个跳过测试用例）
- [x] desktop-control 全面功能测试（23 模块通过）
- [x] 登录重定向问题修复
- [x] Health Controller 路径修复

### 前端系统管理页面（上期遗留完成）
- [x] 应用类型管理页面
- [x] 应用实例管理页面
- [x] 用户管理页面
- [x] 角色管理页面
- [x] 成员管理页面
- [x] 权限管理页面（普通）
- [x] PC 权限管理页面
- [x] 审计日志页面

### 核心组件库（上期遗留完成）
- [x] MfwFormat 格式化组件
- [x] MfwPopup 弹窗系统
- [x] MfwUpload 上传组件
- [x] MfwFormCard 表单卡片
- [x] MfwTableList 表格列表
- [x] MfwPageScene 页面场景
- [x] MfwIconPicker 图标选择器
- [x] MfwUserPicker 用户选择器
- [x] MfwJsonEditor JSON 编辑器

---

## 进行中
无

---

## 待开始

### 组件库文档编写（P2）
- [ ] MfwFormat 组件 API 文档
- [ ] MfwPopup 组件 API 文档
- [ ] MfwUpload 组件 API 文档
- [ ] MfwFormCard 组件 API 文档
- [ ] MfwTableList 组件 API 文档
- [ ] MfwPageScene 组件 API 文档
- [ ] 组件使用示例编写
- [ ] 类型定义导出文档

### 单元测试补充（P2）
- [ ] MfwFormat 单元测试
- [ ] MfwPopup 单元测试
- [ ] MfwUpload 单元测试
- [ ] MfwFormCard 单元测试
- [ ] MfwTableList 单元测试
- [ ] 测试覆盖率报告（目标 80%）

### E2E 测试稳定化（P2）
- [ ] 修复剩余测试失败（如有）
- [ ] 补充关键流程 E2E 测试
- [ ] CI/CD 集成 E2E 测试

---

## 相关文件
- `packages/base-frontend/src/components/` - 组件源码
- `docs/03-框架规范/01-前端规范/` - 前端规范文档
- `tests/e2e/` - E2E 测试目录
- `tests/unit/` - 单元测试目录

---

## 关键决策
- 组件文档采用 Markdown + 示例代码格式
- 单元测试使用 Vitest + Vue Test Utils
- E2E 测试使用 Playwright

---

## 备注
- 上期 E2E 测试修复后需验证结果
- 组件库已完成开发，进入文档化阶段
- 后端 API 127/127 测试通过，状态稳定

---

## 变更记录
| 时间 | 变更类型 | 变更内容 | 原因 |
|------|----------|----------|------|
| 2026-04-03 09:35 | 任务周期归档 | 归档上期任务，开启新周期 | 上期任务全部完成 |

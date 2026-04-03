---
name: frontend-dev-rule
description: 前端开发强制执行规范
type: project
---

# 前端开发规范

> 状态：**强制执行** | 创建：2026-04-02

---

## 开发前必读

**开始前端开发任务前，必须读取以下文档**：
1. `docs/03-框架规范/01-前端规范/统一开发规范.md`
2. `docs/02-团队/02-检查清单/前端检查清单.md`

---

## 组件开发检查清单

### 组件设计
- [ ] 组件职责是否单一
- [ ] Props 定义是否清晰（必须有类型）
- [ ] 事件命名是否规范（onXxx / handleXxx）
- [ ] 是否可复用

### TypeScript 规范
- [ ] 禁止使用 `any`（除非绝对必要且有注释说明）
- [ ] Props 必须有完整类型定义
- [ ] 复杂配置项必须有独立接口

### 禁止行为

| 禁止项 | 原因 | 替代方案 |
|--------|------|----------|
| `el-dialog` | 项目有统一弹窗组件 | 使用 `MfwPopup` |
| `el-drawer` | 项目有统一弹窗组件 | 使用 `MfwPopup` |
| `any` 类型 | 类型安全 | 定义具体类型 |
| 内联样式 | 样式隔离 | 使用 class/SCSS |
| 无 data-testid 的交互元素 | 测试不稳定 | 添加 data-testid |

---

## data-testid 强制要求

### 必须添加 testid 的元素

| 元素类型 | testid 格式 | 示例 |
|----------|-------------|------|
| 搜索按钮 | `{功能}-search-btn` | `user-search-btn` |
| 新增按钮 | `{功能}-create-btn` | `user-create-btn` |
| 编辑按钮 | `{功能}-edit-btn-{id}` | `user-edit-btn-123` |
| 删除按钮 | `{功能}-delete-btn-{id}` | `user-delete-btn-123` |
| 表单容器 | `{功能}-form` | `user-form` |
| 弹窗容器 | `{功能}-dialog` | `user-edit-dialog` |
| 表格行 | `{功能}-row-{id}` | `user-row-123` |

### 添加方式

```vue
<!-- Vue 3 -->
<el-button data-testid="user-search-btn">搜索</el-button>
<el-dialog data-testid="user-edit-dialog">...</el-dialog>

<!-- TSX -->
<Button data-testid="user-search-btn">搜索</Button>
```

---

## 与后端接口对接

### API 调用检查
- [ ] 接口定义是否与文档一致
- [ ] 错误码处理是否完整
- [ ] 数据格式转换是否正确
- [ ] 是否有防抖/节流（高频操作）

### 数据处理
- [ ] 空数据/null 是否处理
- [ ] 长文本是否截断/换行
- [ ] 特殊字符是否处理

---

## 开发完成验证

开发完成后必须执行：

```bash
# 类型检查
pnpm run typecheck:vue

# 单元测试（如有）
pnpm run test:unit

# E2E 测试（如有）
pnpm run test:e2e
```

---

## 验证标准

| 检查项 | 通过标准 |
|--------|----------|
| TypeScript | 无类型错误 |
| 单元测试 | 通过率 100% |
| E2E 测试 | 新功能有对应测试 |

---

**维护**: @frontend-lead | **强制**: 所有前端开发任务
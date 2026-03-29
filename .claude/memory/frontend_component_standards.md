---
name: 前端组件库开发规范
description: 前端组件库开发必须遵循的规范和要求
type: project
---

**组件库名称**: moyan-mfw-base-frontend

**开发原则**:
- 100% 重写，不复制网约车项目代码
- 严格遵循框架规范（目录结构、命名、注释、样式）
- 所有组件以 `Mfw` 前缀命名

**目录结构**: 按功能分类组织（form/、table/、picker/、editor/、upload/、display/、feedback/、page/、layout/、map/、permission/、business/）

**命名规范**:
- 目录：kebab-case（如 form-card/）
- 主文件：PascalCase（Index.vue）
- 组件名：PascalCase + Mfw 前缀（MfwFormCard）
- 导出：mod.ts 统一导出
- 类型：types.ts 独立定义
- Composable: use-xxx.ts 格式

**必须避免的网约车项目问题**:
- 组件无前缀（必须有 Mfw）
- 目录名驼峰（必须 kebab-case）
- 主文件小写（必须 PascalCase）
- V2 后缀（不使用）

**类型定义**: 必须包含 Props、Emits、Slots、Instance 四类接口

**样式规范**: 使用 Design Tokens 体系，基于 Element Plus CSS 变量，无硬编码颜色

**可访问性**: 必须满足 WCAG 2.1 AA 标准（键盘导航、焦点陷阱、ARIA、颜色对比度≥4.5:1）

**测试要求**: 边界条件测试矩阵覆盖，单元测试覆盖率≥80%

**文档规范**: 遵循 API 文档模板（Props/Events/Slots/Expose 表格 + 示例代码）

**优先级**:
- P0：MfwPageScene、MfwUserPicker、ElRadioGroupV2
- P1：MfwQuillEditor、MfwImportXlsx、MfwTabsPage
- P2：MfwMoDiv、MfwAliMap、MfwAuthButton、MfwCountTo

**参考文档**: `.claude/team/frontend-components-plan.md` (v2.0)

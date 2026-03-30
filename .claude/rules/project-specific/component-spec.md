# 组件规范补充

> 状态：**建设中** | 最后更新：2026-03-30

---

## 概述

本文档补充组件开发规范，与 [统一开发规范](../../docs/03-框架规范/统一开发规范.md) 配合使用。

## 技术栈选择

| 项目 | 选择 | 说明 |
|------|------|------|
| 基础组件库 | TSX + `defineComponent` | 类型完整、灵活 |
| 业务组件 | `<script setup lang="ts">` | 简洁、开发效率高 |
| Vue | 3.4+ | 项目统一版本 |
| TypeScript | 5.3+ | 项目统一版本 |
| Element Plus | 2.5+ | UI 组件库 |

## 组件目录结构

```
component-name/
├── index.tsx      # 组件主文件（使用 TSX）
├── types.ts       # 类型定义
├── mod.ts         # 模块导出
└── style.scss     # 样式文件（可选）
```

## 类型定义要求

- ✅ 完整定义所有 Props/Emits/Expose 类型
- ✅ 禁止使用 `any`（除非绝对必要且有注释说明）
- ✅ 复杂配置项必须有独立接口

## 文件头注释

```typescript
/**
 * @fileoverview 文件简要描述
 * @description 详细描述（可选）
 */
```

## 组件注释

```tsx
/**
 * @fileoverview 组件名称和功能描述
 * @description 详细描述组件的用途
 *
 * @example
 * ```vue
 * <mfw-component
 *   :prop1="value1"
 *   @change="handleChange"
 * />
 * ```
 */
```

---

**维护**: @maintainer | **审查**: @audit | **状态**: 建设中

*本文档正在建设中，详细规范请参考《统一开发规范》*

# 命名规范补充

> 状态：**建设中** | 最后更新：2026-03-30

---

## 概述

本文档补充项目命名规范，与 [统一开发规范](../../../docs/03-框架规范/统一开发规范.md) 配合使用。

## 组件命名

| 项目 | 规范 | 示例 |
|------|------|------|
| 组件名前缀 | PascalCase + Mfw | `MfwFormCard` |
| 组件目录 | camel-case + 连字符 | `mfw-form-card/` |
| 主组件文件 | PascalCase | `Index.vue` 或 `MfwFormCard.tsx` |
| 子组件文件 | kebab-case | `column-control.vue` |
| composable | camel-case + use | `use-draft-dox.ts` |
| 类型定义 | camel-case + types | `types.ts` |

## 代码命名

```typescript
// 变量
const userName = 'test';      // camelCase
const MAX_COUNT = 100;        // UPPER_SNAKE_CASE 常量

// 函数
const handleSubmit = () => {};  // 普通方法
const onConfirm = (data) => {}; // 事件处理 onXxx
const handleChange = (v) => {}; // 变化处理 handleXxx
```

## 事件命名

```vue
<template>
  <!-- 组件事件用 onXxx -->
  <MfwComponent @confirm="onConfirm" @close="onClose" />

  <!-- 原生事件用 handleXxx -->
  <button @click="handleClick">按钮</button>
</template>
```

---

**维护**: @maintainer | **审查**: @audit | **状态**: 建设中

*本文档正在建设中，详细规范请参考《统一开发规范》*

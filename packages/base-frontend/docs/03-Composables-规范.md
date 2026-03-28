# Composables 规范

> 状态：**起草中**

---

## 3.1 文件命名

```typescript
// ✅ 推荐：
useUserList.ts           // 功能描述
useOrderCenter.ts        // 页面描述
useFormValidation.ts     // 工具功能

// ❌ 避免：
userList.ts              // 缺少 use 前缀
logic.ts                 // 命名过于模糊
```

---

## 3.2 Composable 结构

```typescript
/**
 * @fileoverview Composable 说明
 */

import { ref, computed } from 'vue';

/**
 * Composable 描述
 */
export function useUserList() {
  // 1. 状态
  const loading = ref(false);
  const list = ref([]);

  // 2. 计算属性
  const isEmpty = computed(() => list.value.length === 0);

  // 3. 方法
  const loadData = async () => {};
  const refresh = async () => {};

  // 4. 返回
  return {
    loading,
    list,
    isEmpty,
    loadData,
    refresh,
  };
}
```

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-28 | 待讨论制定 |

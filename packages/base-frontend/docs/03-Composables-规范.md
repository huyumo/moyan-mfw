# Composables 规范

> 状态：**已完成** | 版本：1.0.0

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

**命名规则：**
- 必须使用 `use` 前缀
- 文件名采用 PascalCase 或 camelCase
- 名称应清晰描述功能或用途

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

**结构顺序：**
1. 导入依赖
2. 响应式状态（ref/reactive）
3. 计算属性（computed）
4. 方法/函数
5. 生命周期钩子（如需）
6. 返回值

---

## 3.3 返回值规范

```typescript
// ✅ 推荐：对象形式返回
return {
  loading,
  list,
  isEmpty,
  loadData,
  refresh,
};

// ❌ 避免：数组形式返回
return [loading, list, loadData];
```

**对象返回的好处：**
- 解构时保持语义清晰
- 方便添加新返回值
- 调用时代码可读性更好

---

## 3.4 使用示例

```vue
<script setup lang="ts">
import { useUserList } from './composables/useUserList';

const { loading, list, loadData } = useUserList();

onMounted(() => {
  loadData();
});
</script>
```

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-29 | 初始版本，定义 Composables 设计与使用规范 |

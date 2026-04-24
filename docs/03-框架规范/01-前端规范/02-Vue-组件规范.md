# Vue 组件规范

> 状态：**已完成** | 版本：1.0.0

---

## 2.1 组件结构顺序

```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup lang="ts">
// 1. 组件配置
defineOptions({ name: 'ComponentName' });

// 2. Props
const props = withDefaults(defineProps<Props>(), {});

// 3. Emits
const emit = defineEmits<{ confirm: [data: any] }>();

// 4. 导入的 Hooks
const { data } = useXxx();

// 5. 响应式数据
const loading = ref(false);
const form = reactive({});

// 6. 计算属性
const list = computed(() => {});

// 7. 方法
const handleSubmit = () => {};

// 8. 生命周期
onMounted(() => {});

// 9. 暴露实例
defineExpose({ method });
</script>

<style scoped lang="scss">
/* 样式 */
</style>
```

---

## 2.2 Props/Emits 定义

### Props 定义

```typescript
interface Props {
  /** 标题 */
  title?: string;
  /** 列表数据 */
  list?: Array<{ id: number; name: string }>;
}

const props = withDefaults(defineProps<Props>(), {
  title: '默认标题',
  list: () => [],
});
```

### Emits 定义

```typescript
const emit = defineEmits<{
  /** 确认事件 */
  confirm: [data: any];
  /** 关闭事件 */
  close: [];
}>();
```

---

## 2.3 组件实例类型

```typescript
export interface ComponentInstance {
  /** 验证方法 */
  validate: () => Promise<boolean>;
  /** 重置方法 */
  reset: () => void;
}

defineExpose<ComponentInstance>({
  validate,
  reset,
});
```

---

## 2.4 组件配置精简

### 2.4.1 移除与默认值重复的配置

**🔴 强制：仅声明与默认值不同的配置项**

`MfwPopup.open` 的 `footer` 具有默认值：`cancelText: '关闭'`，`confirmText: '确认'`，`showCancel: true`，`showConfirm: true`。仅当值与默认值不同时才需显式声明。

```typescript
// ❌ 错误：cancelText 与默认值 '关闭' 重复
MfwPopup.open({
  footer: { cancelText: '关闭', confirmText: '保存' },
});

// ✅ 正确：仅声明与默认值不同的字段
MfwPopup.open({
  footer: { confirmText: '保存' },
});
```

### 2.4.2 简化回调为函数引用

**🟢 推荐：当回调仅调用单个方法时，直接传递函数引用**

```typescript
// ❌ 冗余：不必要的箭头函数包装
on: {
  confirm: () => {
    listPage.value?.refresh();
  },
}

// ✅ 简洁：直接传递函数引用
on: { confirm: listPage.value?.refresh }
```

---

## 2.5 页面组件 loadData 规范

### 2.5.1 直接返回 API 结果

**🔴 强制：当 API 返回值即为 `{ list, total }` 结构时，无需手动重新包装**

`MfwListPage` 和 `MfwCardListPage` 内部已做 `result.list || []` 和 `result.total || 0` 兜底，多余的包装只增加代码量，不增加安全性。

```typescript
// ❌ 错误：多余的 list/total 包装
const loadData = async (params: Record<string, unknown>) => {
  const result = await new ApiRoleFindAll({ query: { ... } });
  return { list: result.list || [], total: result.total || 0 };
};

// ✅ 正确：直接返回 API 结果
const loadData = async (params: Record<string, unknown>) => {
  return await new ApiRoleFindAll({ query: { ... } });
};
```

> **例外**：当 API 返回数组而非 `{ list, total }` 结构时（如 `ApiAppTypeFindAllList`），仍需手动包装为 `{ list, total }`。

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.1.0 | 2026-04-24 | 新增组件配置精简、loadData 规范 |
| 1.0.0 | 2026-03-29 | 初始版本，定义组件结构、Props/Emits、实例类型规范 |

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

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-29 | 初始版本，定义组件结构、Props/Emits、实例类型规范 |

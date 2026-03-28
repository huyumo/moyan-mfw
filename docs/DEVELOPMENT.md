# 墨焱管理后台 - 开发规范文档

> 版本：1.0.0
> 创建时间：2026-03-28

---

## 一、项目结构

```
moyan-mfw/
├── frontend/              # 业务前端应用
│   └── src/
│       ├── business/      # 业务代码
│       │   ├── components/
│       │   ├── views/
│       │   ├── api/
│       │   └── routes.ts
│       └── main.ts
├── packages/
│   └── base-frontend/    # 基础前端框架
│       └── src/
│           ├── components/   # 基础组件
│           ├── layouts/      # 布局组件
│           ├── router/       # 路由
│           ├── store/        # 状态管理
│           └── types/        # 类型定义
├── docs/                  # 项目文档
└── references/            # 参考代码
```

---

## 二、命名规范

### 2.1 文件/目录命名

| 类型 | 规则 | 示例 |
|------|------|------|
| 目录 | kebab-case | `business/views/order-center` |
| 组件文件 | PascalCase | `OrderList.vue` |
| 工具文件 | camelCase | `utils.ts`, `api.ts` |

### 2.2 代码命名

```typescript
// 变量
const userName = 'test';      // camelCase
const MAX_COUNT = 100;        // UPPER_SNAKE_CASE 常量

// 组件
defineOptions({ name: 'OrderList' });  // PascalCase

// 函数
const handleSubmit = () => {};  // camelCase
const onConfirm = (data) => {}; // 事件处理 onXxx
const handleChange = (v) => {}; // 变化处理 handleXxx
```

---

## 三、Vue 组件规范

### 3.1 组件结构顺序

```vue
<template>
  <!-- 模板 -->
</template>

<script lang="ts" setup>
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

<style lang="scss" scoped>
/* 样式 */
</style>
```

### 3.2 Props/Emits 类型定义

```typescript
interface Props {
  /** 标题 */
  title?: string;
  /** 列表数据 */
  list?: Array<{ id: number; name: string }>;
}

const props = withDefaults(defineProps<Props>(), {
  title: '默认标题',
  list: () => []
});

const emit = defineEmits<{
  /** 确认事件 */
  confirm: [data: any];
  /** 关闭事件 */
  close: [];
}>();
```

### 3.3 组件实例类型

```typescript
export interface ComponentInstance {
  /** 验证方法 */
  validate: () => Promise<boolean>;
  /** 重置方法 */
  reset: () => void;
  /** 数据 */
  data: any;
}

defineExpose<ComponentInstance>({
  validate,
  reset,
  data
});
```

---

## 四、注释规范

### 4.1 文件头注释

```typescript
/**
 * @fileoverview 文件简要描述
 */
```

### 4.2 JSDoc 注释

```typescript
/**
 * 函数描述
 * @param value 参数说明
 * @returns 返回值说明
 */
const handleValue = (value: string): void => {};
```

### 4.3 行内注释

```typescript
// 单行注释

/*
 * 多行注释
 * 用于复杂逻辑
 */

// TODO: 待优化
// FIXME: 需修复
```

---

## 五、Git 提交规范

### 5.1 Commit 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 5.2 Type 类型

| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | Bug 修复 |
| docs | 文档更新 |
| style | 代码格式 |
| refactor | 重构 |
| perf | 性能优化 |
| test | 测试 |
| chore | 构建/配置 |
| ci | CI 配置 |

### 5.3 示例

```
feat(components): 新增表格列表组件

- 实现基础表格展示
- 支持分页和排序

Refs: #123
```

---

## 六、最佳实践

### 6.1 异步处理

```typescript
const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.getData();
    data.value = res;
  } catch (error) {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
  }
};
```

### 6.2 事件命名

```vue
<template>
  <!-- 组件事件用 onXxx -->
  <Child @confirm="onConfirm" @close="onClose" />

  <!-- 原生事件用 handleXxx -->
  <button @click="handleClick">按钮</button>
</template>
```

### 6.3 样式规范

```scss
// 使用 BEM 和 CSS 变量
.component-name {
  &__element {
    color: var(--el-text-color-primary);
  }

  &--active {
    background-color: var(--el-color-primary);
  }
}
```

---

## 七、技术栈

- **框架**: Vue 3.4+ (Composition API)
- **语言**: TypeScript 5.3+
- **UI 库**: Element Plus 2.5+
- **构建工具**: Vite 5.0+
- **状态管理**: Pinia 2.1+
- **路由**: Vue Router 4.2+
- **包管理**: pnpm 10.14+

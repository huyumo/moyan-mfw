# Composables 规范

> 状态：**已完成** | 版本：2.0.0

---

## 3.1 文件命名

```typescript
// ✅ 推荐：
useUserList.ts           // 功能描述
useOrderCenter.ts        // 页面描述
useFormValidation.ts     // 工具功能
useApiErrorHandler.ts    // 错误处理
useAuth.ts               // 认证相关

// ❌ 避免：
userList.ts              // 缺少 use 前缀
logic.ts                 // 命名过于模糊
helper.ts                // 语义不明确
```

**命名规则：**
- 🔴 必须使用 `use` 前缀（Vue 组合式 API 规范）
- 🟢 文件名采用 camelCase
- 🟢 名称应清晰描述功能或用途
- ⚪ 按功能分组时可添加功能前缀，如 `auth/useLogin.ts`

---

## 3.2 Composable 结构

### 2.1 基础结构

```typescript
/**
 * @fileoverview 用户列表数据获取
 * @description 提供用户列表的加载、刷新、分页等功能
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { User, ListResponse } from '@/apis/micro-system';
import { ApiUserList } from '@/apis/micro-system';

/**
 * 用户列表 Composable
 * @returns 列表状态、加载方法、刷新方法
 */
export function useUserList() {
  // ========== 1. 响应式状态 ==========
  const loading = ref(false);
  const list = ref<User[]>([]);
  const total = ref(0);
  const page = ref(1);
  const limit = ref(20);

  // ========== 2. 计算属性 ==========
  const isEmpty = computed(() => list.value.length === 0);
  const totalPages = computed(() => Math.ceil(total.value / limit.value));
  const hasMore = computed(() => page.value < totalPages.value);

  // ========== 3. 方法 ==========
  const loadList = async () => {
    loading.value = true;
    try {
      const result = await new ApiUserList({
        params: { page: page.value, limit: limit.value }
      });
      list.value = result.rows;
      total.value = result.total;
    } finally {
      loading.value = false;
    }
  };

  const refresh = async () => {
    page.value = 1;
    await loadList();
  };

  const loadMore = async () => {
    if (hasMore.value) {
      page.value++;
      await loadList();
    }
  };

  // ========== 4. 生命周期（可选）==========
  onMounted(() => {
    loadList();
  });

  // ========== 5. 返回值 ==========
  return {
    // 状态
    loading,
    list,
    total,
    page,
    limit,
    // 计算属性
    isEmpty,
    totalPages,
    hasMore,
    // 方法
    loadList,
    refresh,
    loadMore,
  };
}
```

### 2.2 结构顺序规范

| 顺序 | 内容 | 说明 |
|------|------|------|
| 1 | 导入依赖 | Vue API、类型定义、API 类、其他 Composables |
| 2 | 响应式状态 | `ref` / `reactive` / `shallowRef` |
| 3 | 计算属性 | `computed` |
| 4 | 方法/函数 | 私有方法在前，公共方法在后 |
| 5 | 生命周期钩子 | `onMounted` / `onUnmounted` / `watch` |
| 6 | 返回值 | 对象形式返回 |

---

## 3.3 参数规范

### 3.1 无参数 Composable

适用于状态独立、无需外部配置的场景：

```typescript
// ✅ 推荐：无参数
export function useUserList() {
  // ...
}

// 使用
const { list, loading } = useUserList();
```

### 3.2 简单参数 Composable

适用于需要初始配置的场景：

```typescript
// ✅ 推荐：参数接口化
interface UseUserListOptions {
  initialPage?: number;
  initialLimit?: number;
  autoLoad?: boolean;  // 是否自动加载
}

export function useUserList(options: UseUserListOptions = {}) {
  const {
    initialPage = 1,
    initialLimit = 20,
    autoLoad = true,
  } = options;

  const page = ref(initialPage);
  const limit = ref(initialLimit);

  if (autoLoad) {
    onMounted(() => loadList());
  }

  return { page, limit, loadList };
}

// 使用
const { list } = useUserList({ initialLimit: 50, autoLoad: false });
```

### 3.3 响应式参数 Composable

适用于参数可能变化的场景：

```typescript
// ✅ 推荐：响应式参数
interface UseUserListOptions {
  keyword: Ref<string>;      // 搜索关键词（响应式）
  status: Ref<number>;       // 状态筛选（响应式）
  autoReload?: boolean;      // 参数变化时是否自动重载
}

export function useUserList(options: UseUserListOptions) {
  const { keyword, status, autoReload = true } = options;
  const list = ref<User[]>([]);

  const loadList = async () => {
    const result = await new ApiUserList({
      params: {
        keyword: keyword.value,
        status: status.value,
      }
    });
    list.value = result.rows;
  };

  // 监听参数变化
  watch([keyword, status], () => {
    if (autoReload) {
      loadList();
    }
  });

  onMounted(() => loadList());

  return { list, loadList };
}

// 使用
const keyword = ref('');
const status = ref(1);
const { list } = useUserList({ keyword, status });
```

### 3.4 泛型参数 Composable

适用于类型可复用的场景：

```typescript
// ✅ 推荐：泛型支持
interface UseListOptions<T> {
  apiCall: () => Promise<ListResponse<T>>;
  initialData?: T[];
}

export function useList<T>(options: UseListOptions<T>) {
  const { apiCall, initialData = [] } = options;
  const list = ref<T[]>(initialData);
  const loading = ref(false);

  const load = async () => {
    loading.value = true;
    try {
      const result = await apiCall();
      list.value = result.rows;
    } finally {
      loading.value = false;
    }
  };

  return { list, loading, load };
}

// 使用
const { list: users } = useList<User>({
  apiCall: () => new ApiUserList({ params: { page: 1, limit: 20 } })
});

const { list: orders } = useList<Order>({
  apiCall: () => new ApiOrderList({ params: { page: 1, limit: 20 } })
});
```

---

## 3.4 返回值规范

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
- 支持按需解构

### 4.1 返回值组织

```typescript
export function useUserList() {
  // ...

  return {
    // 状态类 - 便于了解当前状态
    loading,
    list,
    total,
    // 计算属性类 - 便于模板判断
    isEmpty,
    hasMore,
    // 方法类 - 便于用户交互
    loadList,
    refresh,
    loadMore,
  };
}
```

---

## 3.5 生命周期管理

### 5.1 自动清理

在 Composable 内部处理清理逻辑，避免内存泄漏：

```typescript
// ✅ 推荐：自动清理事件监听
export function useEventListener() {
  const handlers = new Map<string, EventListener>();

  const addListener = (target: Window | HTMLElement, event: string, handler: EventListener) => {
    target.addEventListener(event, handler);
    handlers.set(event, handler);
  };

  onUnmounted(() => {
    // 自动移除所有监听器
    handlers.forEach((handler, event) => {
      window.removeEventListener(event, handler);
    });
  });

  return { addListener };
}
```

### 5.2 定时器清理

```typescript
// ✅ 推荐：自动清理定时器
export function usePolling(interval: number, callback: () => void) {
  let timerId: ReturnType<typeof setInterval> | null = null;

  const start = () => {
    timerId = setInterval(callback, interval);
  };

  const stop = () => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  };

  onMounted(() => start());
  onUnmounted(() => stop());

  return { start, stop };
}
```

### 5.3 异步请求清理

```typescript
// ✅ 推荐：清理未完成的异步请求
export function useAsyncData() {
  const controller = new AbortController();
  const data = ref(null);

  const fetchData = async () => {
    try {
      const result = await fetch('/api/data', {
        signal: controller.signal
      });
      data.value = await result.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        return; // 忽略被取消的请求
      }
      throw error;
    }
  };

  onUnmounted(() => {
    controller.abort(); // 取消未完成的请求
  });

  return { data, fetchData };
}
```

---

## 3.6 与 Pinia Store 的区别

### 6.1 使用场景区分

| 场景 | 推荐方案 | 说明 |
|------|----------|------|
| 组件内 UI 状态 | Composable | 按钮状态、表单输入、显示/隐藏 |
| 页面级数据获取 | Composable | 列表加载、详情获取 |
| 跨组件共享状态 | Pinia Store | 主题、布局、用户信息 |
| 跨页面共享状态 | Pinia Store | 全局配置、缓存数据 |
| 需要持久化 | Pinia Store | 用户偏好、访问历史 |
| 服务端状态缓存 | Composable + SWR | API 响应数据、列表缓存 |

### 6.2 Composable vs Store 示例

```typescript
// ✅ Composable - 页面级数据
// composables/useUserList.ts
export function useUserList() {
  const list = ref<User[]>([]);
  const loadList = async () => { /* ... */ };
  return { list, loadList };
}

// 使用：只在当前页面有效
const { list } = useUserList();
```

```typescript
// ✅ Pinia Store - 全局状态
// store/user-store.ts
export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null);
  const fetchCurrentUser = async () => { /* ... */ };
  return { currentUser, fetchCurrentUser };
});

// 使用：跨页面共享
const userStore = useUserStore();
userStore.fetchCurrentUser();
```

### 6.3 组合使用

```typescript
// ✅ Composable + Store 组合
export function useOrderList() {
  const userStore = useUserStore();
  const list = ref<Order[]>([]);

  const loadList = async () => {
    // 使用 Store 中的用户 ID
    const result = await new ApiOrderList({
      params: { userId: userStore.currentUser?.id }
    });
    list.value = result.rows;
  };

  return { list, loadList };
}
```

---

## 3.7 常见错误示例

### 7.1 直接修改 props

```typescript
// ❌ 错误：直接修改 props
export function useFormValue(props: { modelValue: string }) {
  const onChange = (e: Event) => {
    props.modelValue = (e.target as HTMLInputElement).value;
  };
  return { onChange };
}

// ✅ 正确：使用 emits
export function useFormValue(
  props: { modelValue: string },
  emit: (e: 'update:modelValue', v: string) => void
) {
  const onChange = (e: Event) => {
    emit('update:modelValue', (e.target as HTMLInputElement).value);
  };
  return { onChange };
}
```

### 7.2 忽略异步错误

```typescript
// ❌ 错误：无错误处理
export function useUserList() {
  const loadList = async () => {
    const result = await new ApiUserList({ params: { page: 1 } });
    list.value = result.rows;
  };
  return { loadList };
}

// ✅ 正确：添加错误处理
export function useUserList() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const loadList = async () => {
    loading.value = true;
    error.value = null;
    try {
      const result = await new ApiUserList({ params: { page: 1 } });
      list.value = result.rows;
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  };

  return { loading, error, loadList };
}
```

### 7.3 生命周期钩子使用不当

```typescript
// ❌ 错误：在 Composable 外部调用生命周期
export function useUserList() {
  const loadList = async () => { /* ... */ };

  // 错误：生命周期应该在 Composable 内部调用
  // onMounted(() => loadList());

  return { loadList };
}

// ✅ 正确：在内部处理或提供选项
export function useUserList(options: { autoLoad?: boolean } = {}) {
  const { autoLoad = true } = options;
  const loadList = async () => { /* ... */ };

  if (autoLoad) {
    onMounted(() => loadList());
  }

  return { loadList };
}
```

### 7.4 返回值泄露内部实现

```typescript
// ❌ 错误：暴露内部细节
export function useUserList() {
  const controller = new AbortController();
  const rawResponse = ref<Response | null>(null);

  // 不应该暴露这些内部实现
  return { controller, rawResponse, loadList };
}

// ✅ 正确：只暴露必要的接口
export function useUserList() {
  const list = ref<User[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  return {
    list,
    loading,
    error,
    loadList,
    refresh: () => loadList(),
  };
}
```

---

## 3.8 使用示例

### 8.1 在页面组件中使用

```vue
<template>
  <div class="user-list-page">
    <el-table :data="list" v-loading="loading">
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="mobile" label="手机" />
    </el-table>
    <el-pagination
      :current-page="page"
      :page-size="limit"
      :total="total"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { useUserList } from '@/composables/useUserList';

const { loading, list, page, limit, total, loadList } = useUserList({
  initialLimit: 20,
  autoLoad: true,
});

const handlePageChange = (newPage: number) => {
  page.value = newPage;
  loadList();
};
</script>
```

### 8.2 在 Composable 中复用

```vue
<script setup lang="ts">
import { useUserList } from '@/composables/useUserList';
import { usePagination } from '@/composables/usePagination';

// 组合多个 Composables
const pagination = usePagination({ initialPageSize: 20 });
const userList = useUserList({
  page: pagination.page,
  limit: pagination.pageSize,
  autoReload: true,
});

// 使用组合后的功能
const { list, loading } = userList;
const { page, total, hasNext } = pagination;
</script>
```

### 8.3 响应式参数示例

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useUserList } from '@/composables/useUserList';

const keyword = ref('');
const status = ref<number | undefined>();

// 参数变化时自动重新加载
const { list, loading } = useUserList({
  keyword,
  status,
  autoReload: true,  // 参数变化时自动重载
});
</script>
```

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 2.0.0 | 2026-03-29 | 大幅扩充：新增参数规范、生命周期管理、与 Store 区别、常见错误示例 |
| 1.0.0 | 2026-03-29 | 初始版本，定义 Composables 设计与使用规范 |

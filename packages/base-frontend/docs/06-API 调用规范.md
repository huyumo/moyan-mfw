# API 调用规范

> 状态：**已完成** | 版本：1.0.0

---

## 6.1 API 层设计

### 6.1.1 API 生成

本项目 API 层由 `moyan-api` 库自动生成，无需手动编写：

```typescript
// API 由 moyan-api 自动生成
import { UserApi, OrderApi } from 'moyan-api';

// 使用示例
const userApi = new UserApi();
const users = await userApi.list();
```

### 6.1.2 API 调用位置

API 调用应该在 **Composables** 或 **页面组件** 中进行：

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { UserApi } from 'moyan-api';

const users = ref([]);
const loading = ref(false);

const loadUsers = async () => {
  loading.value = true;
  try {
    const api = new UserApi();
    users.value = await api.list();
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadUsers();
});
</script>
```

### 6.1.3 封装 API 调用

对于复杂的 API 调用，建议封装为 Composable：

```typescript
// composables/useUserList.ts
import { ref } from 'vue';
import { UserApi, type User } from 'moyan-api';

export function useUserList() {
  const loading = ref(false);
  const list = ref<User[]>([]);

  const loadUsers = async () => {
    loading.value = true;
    try {
      const api = new UserApi();
      list.value = await api.list();
    } finally {
      loading.value = false;
    }
  };

  return { loading, list, loadUsers };
}
```

---

## 6.2 错误处理

### 6.2.1 try-catch 块

所有异步 API 调用必须使用 try-catch 处理错误：

```typescript
const loadData = async () => {
  try {
    const api = new UserApi();
    const data = await api.list();
    return data;
  } catch (error) {
    // 处理错误
    console.error('加载失败:', error);
    throw error;
  }
};
```

### 6.2.2 统一错误处理

使用 Pinia Store 或全局错误处理器处理常见错误：

```typescript
// store/error-store.ts
import { ElMessage } from 'element-plus';

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    ElMessage.error(error.message);
  } else {
    ElMessage.error('操作失败，请稍后重试');
  }
}
```

### 6.2.3 错误类型

```typescript
// 常见错误类型
interface ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;
}

// 错误状态码处理
const handleError = (error: ApiError) => {
  switch (error.status) {
    case 401:
      // 未授权，跳转到登录页
      router.push('/login');
      break;
    case 403:
      // 权限不足
      ElMessage.error('权限不足');
      break;
    case 404:
      // 资源不存在
      ElMessage.error('资源不存在');
      break;
    default:
      ElMessage.error('操作失败');
  }
};
```

---

## 6.3 请求参数

### 6.3.1 参数类型定义

使用 TypeScript 接口定义请求参数：

```typescript
interface ListUserParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

const loadUsers = async (params: ListUserParams) => {
  const api = new UserApi();
  return await api.list(params);
};
```

### 6.3.2 参数验证

在调用 API 前验证参数：

```typescript
const createUser = async (name: string) => {
  if (!name || name.trim() === '') {
    throw new Error('用户名不能为空');
  }

  const api = new UserApi();
  return await api.create({ name });
};
```

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-29 | 初始版本，定义 API 调用和错误处理规范 |

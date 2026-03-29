# API 调用规范

> 状态：**已完成** | 版本：1.1.0

---

## 6.1 moyan-api 库

### 6.1.1 简介

[moyan-api](https://gitee.com/ymoo/moyan-api) 是根据后端 OpenAPI 3 (Swagger) 规范自动生成的 TypeScript API 客户端库。

**特点：**
- 根据后端 Swagger 文档自动生成
- 完整的 TypeScript 类型支持
- 无需手动编写 API 调用代码
- 前后端接口定义保持一致

### 6.1.2 安装

```bash
pnpm add moyan-api
```

### 6.1.3 API 生成流程

```
后端 Swagger/OpenAPI 3 定义
         ↓
   moyan-api 生成器
         ↓
  TypeScript API 客户端
         ↓
   发布到 npm 仓库
```

**生成命令（后端项目）：**
```bash
# 后端项目根目录
moyan api:generate
```

**更新 API 包（前端项目）：**
```bash
# 检查更新
pnpm outdated moyan-api

# 更新到最新版本
pnpm update moyan-api
```

### 6.1.4 使用示例

```typescript
import { UserApi, OrderApi } from 'moyan-api';

// 实例化 API 类
const userApi = new UserApi();

// 调用 API 方法
const users = await userApi.list();
const user = await userApi.get(id);
```

---

## 6.2 API 调用规范

### 2.1 调用位置

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

### 2.2 封装为 Composable

对于复杂的 API 调用，建议封装为 Composable：

```typescript
// composables/useUserList.ts
import { ref } from 'vue';
import { UserApi, type User } from 'moyan-api';

export function useUserList() {
  const loading = ref(false);
  const list = ref<User[]>([]);
  const total = ref(0);

  const loadUsers = async (params?: { page?: number; size?: number }) => {
    loading.value = true;
    try {
      const api = new UserApi();
      const result = await api.list(params);
      list.value = result.items;
      total.value = result.total;
    } finally {
      loading.value = false;
    }
  };

  return { loading, list, total, loadUsers };
}
```

### 2.3 在 Pinia Store 中使用

```typescript
// store/user-store.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { UserApi } from 'moyan-api';

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null);

  const fetchCurrentUser = async () => {
    const api = new UserApi();
    currentUser.value = await api.getCurrent();
  };

  return { currentUser, fetchCurrentUser };
});
```

---

## 6.3 错误处理

### 3.1 try-catch 块

所有异步 API 调用必须使用 try-catch 处理错误：

```typescript
const loadData = async () => {
  try {
    const api = new UserApi();
    const data = await api.list();
    return data;
  } catch (error) {
    console.error('加载失败:', error);
    throw error;
  }
};
```

### 3.2 moyan-api 错误类型

```typescript
import { ApiError } from 'moyan-api';

try {
  const api = new UserApi();
  await api.get(id);
} catch (error) {
  if (error instanceof ApiError) {
    // API 错误，包含状态码和错误信息
    console.error('API Error:', error.status, error.message);

    switch (error.status) {
      case 401:
        // 未授权，跳转到登录页
        router.push('/login');
        break;
      case 403:
        ElMessage.error('权限不足');
        break;
      case 404:
        ElMessage.error('资源不存在');
        break;
      default:
        ElMessage.error(error.message || '操作失败');
    }
  } else {
    // 网络错误或其他错误
    ElMessage.error('网络错误，请稍后重试');
  }
}
```

### 3.3 统一错误处理

```typescript
// utils/api-error-handler.ts
import { ApiError } from 'moyan-api';
import { ElMessage } from 'element-plus';
import { router } from '@/router';

export function handleApiError(error: unknown): void {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        router.push('/login');
        break;
      case 403:
        ElMessage.error('权限不足');
        break;
      case 404:
        ElMessage.error('资源不存在');
        break;
      case 400:
        ElMessage.error(error.message || '请求参数错误');
        break;
      case 500:
        ElMessage.error('服务器错误');
        break;
      default:
        ElMessage.error(error.message || '操作失败');
    }
  } else {
    ElMessage.error('网络错误，请稍后重试');
  }
}
```

---

## 6.4 请求参数

### 4.1 使用生成的类型

`moyan-api` 会自动生成请求和响应的 TypeScript 类型：

```typescript
import { UserApi, type ListUserParams, type User } from 'moyan-api';

const loadUsers = async (params: ListUserParams) => {
  const api = new UserApi();
  return await api.list(params);
};
```

### 4.2 参数验证

在调用 API 前验证必要的参数：

```typescript
const createUser = async (name: string) => {
  if (!name || name.trim() === '') {
    ElMessage.warning('用户名不能为空');
    return;
  }

  const api = new UserApi();
  return await api.create({ name });
};
```

---

## 6.5 最佳实践

### 5.1 避免重复实例化

```typescript
// ✅ 推荐：在 Composable 中复用实例
export function useUserApi() {
  const api = new UserApi();
  return { api };
}

// ❌ 避免：在循环中重复实例化
list.forEach(() => {
  const api = new UserApi();
  // ...
});
```

### 5.2 批量操作

```typescript
// ✅ 推荐：使用批量 API（如果后端支持）
const api = new UserApi();
await api.batchCreate(userList);

// ❌ 避免：循环调用单个 API
for (const user of userList) {
  await api.create(user);
}
```

### 5.3 请求取消

```typescript
import { ref, onUnmounted } from 'vue';
import { UserApi } from 'moyan-api';

export function useUserList() {
  const loading = ref(false);
  const controller = new AbortController();

  const loadUsers = async () => {
    loading.value = true;
    try {
      const api = new UserApi();
      // 如果 API 支持 AbortSignal
      return await api.list({ signal: controller.signal });
    } finally {
      loading.value = false;
    }
  };

  onUnmounted(() => {
    controller.abort();
  });

  return { loading, loadUsers };
}
```

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.1.0 | 2026-03-29 | 更新为 moyan-api 库使用规范 |
| 1.0.0 | 2026-03-29 | 初始版本，定义 API 调用和错误处理规范 |

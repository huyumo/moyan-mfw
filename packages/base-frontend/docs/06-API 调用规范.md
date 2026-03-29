# API 调用规范

> 状态：**已完成** | 版本：2.0.0

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

---

## 6.2 API 类定义规范

### 2.1 文件组织结构

```
src/apis/
├── micro-system/           # 按微服务模块划分
│   ├── index.ts            # API 类定义
│   └── schemas.ts          # 类型定义
├── micro-log/
│   ├── index.ts
│   └── schemas.ts
└── ...
```

### 2.2 API 类结构

每个 API 类继承自 `ApiCall<RequestType, ResponseType>`：

```typescript
// src/apis/micro-system/index.ts
import { ApiCall, MoMethod } from 'moyan-api'
import type { User, DtoUserPagerRes } from './schemas'

/**
 * 用户模块->获取用户列表
 */
export class ApiUserList extends ApiCall<
  {
    page: number
    limit: number
    keyword?: string
    status?: number
  },
  DtoUserPagerRes
> {
  path = '/sys/user/list'
  method: MoMethod = 'GET'
  auth = true
}
```

**属性说明：**

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `path` | `string` | ✅ | API 请求路径 |
| `method` | `MoMethod` | ✅ | HTTP 方法：`'GET' | 'POST' | 'PUT' | 'DELETE'` |
| `auth` | `boolean` | ✅ | 是否需要认证 |

### 2.3 类型定义规范

类型定义应放在 `schemas.ts` 文件中：

```typescript
// src/apis/micro-system/schemas.ts

// 基础类型映射
export type ObjectId = string
export type int = number | string
export type json = { [key: string]: any }
export type datetime = Date | string
export type array = Array<any>

// 请求 DTO
export type CreateUserDto = {
  name: string       // 姓名
  mobile?: string    // 手机号
  password?: string  // 密码
}

// 响应 DTO
export type User = {
  id: number
  name: string
  mobile: string
  avatar?: string
  status: number     // 0:正常，1:删除，2:禁用
  created: datetime
  updated: datetime
}

// 分页响应
export type DtoUserPagerRes = {
  total: number
  rows: Array<User>
  page: number
  limit: number
}
```

---

## 6.3 API 调用方式

### 3.1 基础调用

```typescript
import { ApiUserList } from '@/apis/micro-system'

// GET 请求 - 参数通过 params 传递
const result = await new ApiUserList({ params: { page: 1, limit: 20 } })

// POST 请求 - 参数通过 data 传递
const result = await new ApiUserCreate({ data: { name: '张三', mobile: '13800138000' } })

// 带成功提示的调用
const result = await new ApiUserDelete({
  params: { id: 1 },
  option: { hintSuccess: true }  // 成功后自动显示提示
})
```

### 3.2 在页面组件中调用

```vue
<template>
  <page-scene-v2 ref="pageScene">
    <table-list
      :tableColumn="tableColumn"
      :pageRequest="pageRequest"
      :tableRowHandle="tableRowHandle"
      @edit="handleEdit"
      @del="handleDel"
    />
  </page-scene-v2>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import {
  ApiUserList,
  ApiUserDelete,
  ApiUserEdit,
  type User
} from '@/apis/micro-system'

export default defineComponent({
  setup() {
    const pageScene = ref()

    // 分页请求函数
    const pageRequest = async (e: any) => {
      return await new ApiUserList({ params: e })
    }

    // 编辑
    const handleEdit = (scope: { row: User }) => {
      console.log('编辑用户:', scope.row)
    }

    // 删除
    const handleDel = async (scope: { row: User }) => {
      await new ApiUserDelete({ params: { id: scope.row.id } })
      pageScene.value?.doSearch() // 刷新列表
    }

    return {
      pageScene,
      pageRequest,
      handleEdit,
      handleDel
    }
  }
})
</script>
```

### 3.3 在 Composable 中调用

```typescript
// composables/useUser.ts
import { ref } from 'vue'
import { ApiUserList, ApiUserInfoFindOne, type User } from '@/apis/micro-system'

export function useUser() {
  const loading = ref(false)
  const userList = ref<User[]>([])
  const currentUser = ref<User | null>(null)

  // 获取用户列表
  const loadUsers = async (params: { page: number; limit: number }) => {
    loading.value = true
    try {
      const result = await new ApiUserList({ params })
      userList.value = result.rows
    } finally {
      loading.value = false
    }
  }

  // 获取用户详情
  const loadUserDetail = async (id: number) => {
    const result = await new ApiUserInfoFindOne({ params: { id } })
    currentUser.value = result
    return result
  }

  return {
    loading,
    userList,
    currentUser,
    loadUsers,
    loadUserDetail
  }
}
```

### 3.4 在 Pinia Store 中调用

```typescript
// store/user-store.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ApiUserInfoFindSelf, type User } from '@/apis/micro-system'

export const useUserStore = defineStore('user', () => {
  const info = ref<User | null>(null)

  // 获取当前用户信息
  const fetchCurrentUser = async () => {
    const result = await new ApiUserInfoFindSelf()
    info.value = result
    return result
  }

  // 退出登录
  const logout = () => {
    info.value = null
    // 清除本地存储
  }

  return {
    info,
    fetchCurrentUser,
    logout
  }
})
```

---

## 6.4 错误处理

### 4.1 全局错误处理配置

全局错误处理在 `src/plugins/api.ts` 中统一配置：

```typescript
// src/plugins/api.ts
import { ElMessage } from 'element-plus'
import { ApiCall, ApiEntity, ApiEvents } from 'moyan-api'
import { router } from '@/router'
import { storeUser } from '@/common/use/store/user'

// 初始化 API 客户端
ApiCall.use(new MoAxios())

// 成功事件 - 自动下载文件
ApiCall.emitter.on(ApiEvents.Success, (apiCall: ApiCall<any, any>) => {
  if (apiCall.option.fileName && apiCall.method === 'GET') {
    FileSaver.saveAs(window.URL.createObjectURL(apiCall.result), apiCall.option.fileName)
  }
})

// 成功提示事件
ApiCall.emitter.on(ApiEvents.HintSuccess, (apiCall: ApiCall<any, any>) => {
  ApiCall.hasPrompted = true
  ElMessage.success({
    message: apiCall.successMsg,
    onClose: () => {
      ApiCall.hasPrompted = false
    }
  })
})

// 失败提示事件
ApiCall.emitter.on(ApiEvents.HintFail, (apiCall: ApiCall<any, any>) => {
  // 403 跳转到无权限页面
  if (apiCall.response.status === 403) {
    setTimeout(() => {
      router.push('/disabled')
    }, 1000)
    return
  }

  // 处理未登录
  const message = apiCall.failMsg === 'Unauthorized'
    ? '登录已过期，请重新登录'
    : apiCall.failMsg

  // 忽略首页的错误提示
  const ignored = ['/']
  if (!MoAxios.$route || ignored.includes(MoAxios.$route.path)) {
    return
  }

  message && ElMessage.error({
    message,
    onClose: () => {
      ApiCall.hasPrompted = false
    }
  })
})

// 未授权事件 - 自动退出登录
ApiCall.emitter.on(ApiEvents.Unauthorized, () => {
  storeUser.logout()
  router.push('/login')
})
```

### 4.2 HTTP 状态码处理

```typescript
// src/plugins/api.ts - 响应拦截器
this.$axios.interceptors.response.use(
  (res) => {
    if (typeof this.options.render === 'function') {
      return this.options.render(res)
    }
    return res
  },
  async (error) => {
    if (error && error.response) {
      switch (error.response.status) {
        case 502:
          error.message = '网关错误'
          break
        case 504:
          error.message = '网关超时'
          break
        case 505:
          error.message = '版本不受支持'
          break
        default:
          error.message = error.response.data.message
          break
      }
    }
    throw error
  }
)
```

### 4.3 本地错误处理

特殊场景需要本地处理错误：

```typescript
// 需要特殊处理的场景
const handleLogin = async () => {
  try {
    const result = await new ApiUserAuthLoginByPwd({
      params: { account, password }
    })
    // 登录成功处理
  } catch (error) {
    // 自定义错误处理
    console.error('登录失败:', error)
    ElMessage.error('账号或密码错误')
  }
}

// 忽略某些错误的场景
const loadData = async () => {
  const result = await new ApiUserList({
    params: { page: 1, limit: 20 },
    option: {
      ignoreError: true  // 忽略全局错误提示
    }
  })
  return result
}
```

---

## 6.5 请求配置

### 5.1 请求头配置

请求头由 `MoAxios` 自动配置，无需手动设置：

```typescript
// 自动添加的请求头
headers: {
  Authorization: `Bearer ${accessToken}`,
  'x-apptypekey': activeAppEntity?.app_type_key || '',
  'x-user-id': (storeUser?.info?.value?.id || '') + '',
}
```

### 5.2 文件下载

```typescript
// 下载 Excel 文件
const handleExport = async () => {
  await new ApiUserList({
    params: {
      page: 1,
      limit: 10000,
      $export: true  // 导出标志
    },
    option: {
      fileName: '用户列表.xlsx'  // 下载文件名
    }
  })
  // 文件会自动下载，无需额外处理
}
```

### 5.3 文件上传

```typescript
// 上传文件
const handleUpload = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  const result = await new ApiUploadUploadFile({
    data: formData
  })
  return result
}
```

### 5.4 请求选项

| 选项 | 类型 | 说明 |
|------|------|------|
| `hintSuccess` | `boolean` | 成功后显示提示 |
| `hintFail` | `boolean` | 失败后显示提示 |
| `successMsg` | `string` | 自定义成功提示消息 |
| `failMsg` | `string` | 自定义失败提示消息 |
| `fileName` | `string` | 下载文件名 |
| `ignoreError` | `boolean` | 忽略全局错误处理 |
| `onprogress` | `function` | 下载进度回调 |

---

## 6.6 最佳实践

### 6.1 API 类命名规范

```typescript
// ✅ 推荐：清晰描述功能的命名
export class ApiUserList extends ApiCall { }           // 获取列表
export class ApiUserInfoFindOne extends ApiCall { }    // 获取单个详情
export class ApiUserInfoAdd extends ApiCall { }        // 添加
export class ApiUserInfoEdit extends ApiCall { }       // 编辑
export class ApiUserInfoDelete extends ApiCall { }     // 删除
export class ApiUserAuthLoginByPwd extends ApiCall { } // 登录

// ❌ 避免：模糊的命名
export class ApiGetData extends ApiCall { }
export class ApiDoSomething extends ApiCall { }
```

### 6.2 类型导入规范

```typescript
// ✅ 推荐：使用 type 导入类型
import { ApiUserList } from '@/apis/micro-system'
import type { User, DtoUserPagerRes } from '@/apis/micro-system'

// ❌ 避免：混合导入
import { ApiUserList, User, DtoUserPagerRes } from '@/apis/micro-system'
```

### 6.3 注释规范

```typescript
// ✅ 推荐：JSDoc 风格注释
/**
 * 用户模块->获取用户列表
 */
export class ApiUserList extends ApiCall<...> {
  path = '/sys/user/list'
  method: MoMethod = 'GET'
  auth = true
}

/**
 * 用户模块->根据手机号获取用户信息
 */
export class ApiUserInfoByMobile extends ApiCall<
  { mobile: string },  // 请求参数
  User                 // 响应类型
> {
  path = '/sys/user/info/byMobile'
  method: MoMethod = 'GET'
  auth = true
}
```

### 6.4 避免重复请求

```typescript
// ✅ 推荐：复用请求结果
const userStore = useUserStore()
const userInfo = await userStore.fetchCurrentUser()
// 其他地方直接使用 store 中的数据

// ❌ 避免：重复请求相同数据
const info1 = await new ApiUserInfoFindSelf()
const info2 = await new ApiUserInfoFindSelf()
```

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 2.0.0 | 2026-03-29 | 重写文档，基于 moyan-api 生成器模式，新增 API 类定义规范 |
| 1.1.0 | 2026-03-29 | 更新为 moyan-api 库使用规范 |
| 1.0.0 | 2026-03-29 | 初始版本，定义 API 调用和错误处理规范 |

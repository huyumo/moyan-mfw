# 02 · 编码规范

## 注释规范

### 每个文件必须包含

```typescript
/**
 * @fileoverview 文件中文简述
 * @description 文件功能详述
 */
```

- 类/接口必须有描述注释
- 公共方法必须有 JSDoc（`@param` / `@returns`）
- 复杂逻辑必须有行内注释
- 禁止无意义注释（如 `// 赋值`）

### 后端注释示例

```typescript
/**
 * @fileoverview 用户控制器
 * @description 处理用户相关 HTTP 请求
 */
@Controller('users')
export class UserController {
  /**
   * 创建用户
   */
  @Post()
  async create(@Body() dto: CreateUserDto) { ... }

  /**
   * 根据 ID 查询用户
   * @param id - 用户 ID
   * @returns 用户信息
   */
  async findById(id: string): Promise<User> { ... }
}
```

### 前端注释示例

```vue
<!--
/**
 * @fileoverview 用户管理列表页面
 * @description 展示用户列表，支持搜索、新建、编辑、删除
 */
-->
<template>...</template>

<script setup lang="ts">
/** 搜索模板 */
const searchTemplate = [...]
/** 加载数据 */
const loadData = async (params) => { ... }
</script>
```

---

## 命名规范

### 通用

| 类别 | 规范 | 示例 |
|------|------|------|
| 文件名 | kebab-case | `user.service.ts` / `create-user.dto.ts` |
| 类名 | PascalCase | `UserService` / `CreateUserDto` |
| 接口名 | PascalCase | `UserInfo` / `PageQuery` |
| 函数/方法 | camelCase | `findById` / `handleAdd` |
| 变量 | camelCase | `appId` / `searchTemplate` |
| 常量 | UPPER_SNAKE_CASE | `TOKEN_KEY` / `AUTH_TOKEN_KEY` |
| 布尔变量 | is/has/can 前缀 | `isAuthenticated` / `hasPermission` / `canEdit` |
| 事件处理 | handle 前缀 | `handleAdd` / `handleDelete` / `handleEdit` |

### 后端专属

| 类别 | 规范 | 示例 |
|------|------|------|
| Entity 类 | 单数名词 | `User` / `AppType` |
| 表名 | snake_case 复数 | `sys_users` / `sys_app_types` |
| 列名 | camelCase | `userName` / `appTypeId` |
| DTO 请求 | 动作+名词+Dto | `CreateUserDto` / `QueryUserDto` |
| DTO 响应 | 名词+ResponseDto | `UserResponseDto` |
| 权限编码 | 小写+冒号分隔 | `pc_root:sys:user` |
| Service/Module | 单实体扁平，多实体子目录 | — |

### 前端专属

| 类别 | 规范 | 示例 |
|------|------|------|
| 组件目录 | kebab-case | `mfw-form-card/` |
| 组件注册名 | PascalCase + Mfw 前缀 | `MfwFormCard` |
| CSS 类 | BEM + mfw 前缀 | `.mfw-card` / `.mfw-card__header` |
| Composable | use 前缀 + kebab-case | `use-color-mode.ts` |
| Store | xxx-store | `auth-store.ts` / `layout-store.ts` |
| 页面目录 | kebab-case | `user/` / `app-type/` |
| 组件中转 | `mod.ts` 负责 `default → 具名` 重导出 | — |

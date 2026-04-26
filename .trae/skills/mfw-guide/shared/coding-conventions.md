---
version: "1.0"
last_updated: "2026-04-25"
scope: shared
triggers:
  - 命名规范
  - 注释规范
  - 编码惯例
  - 文件命名
  - 变量命名
dependencies: []
maturity: stable
tags: [命名, 注释, 前端, 后端, 规范]
---

# 编码规范

## 注释规范

### 后端注释标准

每个文件必须有 `@fileoverview` 和 `@description`：

```typescript
/**
 * @fileoverview 用户控制器
 * @description 处理用户相关 HTTP 请求
 */

/**
 * 用户控制器
 * @description 处理用户相关的 CRUD 请求
 */
@ApiTags('user', '用户相关接口')
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

### 前端注释标准

```vue
<!--
/**
 * @fileoverview 角色管理列表页面
 * @description 管理应用级角色和内置角色
 */
-->
<template>...</template>

<script setup lang="ts">
/** 状态常量 */
const STATUS = { ENABLED: 1, DISABLED: 0 } as const;

/** 搜索模板 */
const searchTemplate = [...];

/** 加载数据 */
const loadData = async (params: Record<string, unknown>) => { ... };
</script>
```

### 注释规则

- 每个文件顶部必须有 `@fileoverview` + `@description`
- 类/接口必须有描述注释
- 公共方法必须有 JSDoc（含 `@param`、`@returns`）
- 复杂逻辑必须有行内注释
- 常量定义使用 `/** 注释 */`
- 禁止无意义注释（如 `// 赋值`）

## 命名规范

### 通用规则

| 类别 | 规范 | 示例 |
|------|------|------|
| 文件名 | kebab-case | `user.service.ts` / `create-user.dto.ts` |
| 类名 | PascalCase | `UserService` / `CreateUserDto` |
| 接口名 | PascalCase + I 前缀（可选） | `UserInfo` / `IUserInfo` |
| 函数/方法 | camelCase | `findById` / `handleAdd` |
| 变量 | camelCase | `appId` / `searchTemplate` |
| 常量 | UPPER_SNAKE_CASE | `STATUS.ENABLED` / `AUTH_TOKEN_KEY` |
| 布尔变量 | is/has/can 前缀 | `isAuthenticated` / `hasPermission` / `canEdit` |
| 事件处理 | handle 前缀 | `handleAdd` / `handleDelete` / `handleEdit` |

### 后端专属命名

| 类别 | 规范 | 示例 |
|------|------|------|
| Entity 类 | 单数名词 | `User` / `AppType` / `RolePermission` |
| 表名 | snake_case 复数 | `sys_users` / `sys_app_types` |
| 列名 | camelCase | `userName` / `appTypeId` |
| DTO 请求类 | 动作+名词+Dto | `CreateUserDto` / `QueryUserDto` / `UpdateUserDto` |
| DTO 响应类 | 名词+ResponseDto | `UserResponseDto` / `RoleResponseDto` |
| 权限编码 | 小写+冒号分隔 | `pc_root:sys:user` |
| 审计模块 | 大写枚举 | `AuditModule.USER` |

### 前端专属命名

| 类别 | 规范 | 示例 |
|------|------|------|
| 组件目录 | kebab-case | `mfw-form-card/` |
| 组件文件 | `Index.vue` 或 `Index.tsx` | — |
| 组件注册名 | PascalCase + Mfw 前缀 | `MfwFormCard` |
| 组件 CSS 类 | BEM + mfw 前缀 | `.mfw-card` / `.mfw-card__header` |
| composable | use 前缀 + kebab-case 文件 | `use-color-mode.ts` |
| Store | xxx-store | `auth-store.ts` / `layout-store.ts` |
| 页面目录 | kebab-case | `user/` / `app-type/` / `audit-log/` |

## 反模式（Red Flags）— 立即停止

- ✋ 文件名使用 PascalCase 或 camelCase → 必须使用 kebab-case（`user.service.ts`）
- ✋ 组件注册名缺少 `Mfw` 前缀 → 必须 `MfwXxx` 格式
- ✋ CSS 类名缺少 `mfw-` 前缀 → 必须使用 BEM + `mfw-` 前缀
- ✋ 文件缺少 `@fileoverview` + `@description` 注释 → 每个文件必须有
- ✋ 布尔变量不用 is/has/can 前缀 → 如 `isVisible`、`hasPermission`
- ✋ 事件处理不用 handle 前缀 → 如 `handleAdd`、`handleDelete`

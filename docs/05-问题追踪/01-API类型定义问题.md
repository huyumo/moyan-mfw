# API 类型定义问题记录

> 状态：**已解决** | 版本：1.4.0 | 创建日期：2026-04-01

---

## 重要说明：moyan-api 正确用法

### API 调用方式

```typescript
// 正确用法
new ApiXxx({
  params: { ... },        // 请求参数（GET 查询字符串 / POST 请求体）
  query: { id: '123' },   // URL 路径参数（替换 /api/users/{id}）
  option: { ... }         // 请求选项（hintSuccess, hintFail 等）
})

// 示例
// GET 请求
const result = await new ApiUserList({ params: { page: 1, limit: 20 } })

// POST 请求
const result = await new ApiUserCreate({ params: { name: '张三' } })

// 带路径参数
const result = await new ApiUserDelete({ query: { id: '123' } })

// 带成功提示
const result = await new ApiUserCreate({
  params: { name: '张三' },
  option: { hintSuccess: true }
})
```

### 适配器配置

适配器已在 `src/plugins/api.ts` 中配置，通过 `src/plugins/index.ts` 的 `setupPlugins(app)` 自动安装。

---

## 问题描述

`moyan-api` 生成的 TypeScript 类型定义存在以下问题：

---

### 1. ApiPermissionFindAll - permissionType 类型错误

**错误类型**：类型定义与实际不符

**API 定义**（错误）：
```typescript
export class ApiPermissionFindAll extends ApiCall<
  {
    permissionType?: number // ❌ 错误：定义为 number
    pageSize?: number
    ...
  },
  ...
>
```

**实际后端定义**（正确）：
```typescript
export enum PermissionType {
  PC = 'PC',     // 平台权限
  NORMAL = 'NORMAL', // 普通权限
}
```

**临时解决方案**：
```typescript
new ApiPermissionFindAll({
  params: {
    permissionType: 'NORMAL' as any, // 类型断言绕过
  },
});
```

---

### 2. UpdatePermissionDto - permissionValue 类型错误

**错误类型**：`integer` 不是标准 TypeScript 类型

**DTO 定义**：
```typescript
export type UpdatePermissionDto = {
  permissionValue?: integer // ❌ integer 不是标准类型
}
```

**临时解决方案**：
```typescript
new ApiPermissionUpdate({
  query: { id: xxx },
  params: { permissionValue: newValue as any },
});
```

---

### 3. AppDetailResponseDto - 嵌套对象类型定义

**错误类型**：嵌套对象定义为 `object` 而非具体类型

**DTO 定义**：
```typescript
export type AppDetailResponseDto = {
  appType: object // ❌ 应该是具体类型
  owner: object   // ❌ 应该是具体类型
}
```

**临时解决方案**：
```typescript
(row.appType as any)?.typeName
(row.owner as any)?.nickname
```

---

### 4. UserInfoDto - 缺少 phone 属性

**错误类型**：类型定义缺少字段

**临时解决方案**：
```typescript
(row.user as any)?.phone
```

---

### 5. UpdateMemberRolesDto - roleIds 类型错误

**错误类型**：`Array<array>` 而非 `Array<string>`

**DTO 定义**：
```typescript
export type UpdateMemberRolesDto = {
  roleIds: Array<array> // ❌ array 不是标准类型
}
```

**临时解决方案**：
```typescript
params: { roleIds: selectedRoleIds.value as any }
```

---

### 6. ApiUserFindAll - 缺少 keyword 参数

**错误类型**：API 定义与实际后端不一致

**临时解决方案**：
```typescript
new ApiUserFindAll({
  params: {
    username: keyword,
    phone: keyword, // 用两个字段模拟 keyword
  },
});
```

---

## 根本原因

`moyan-api` 生成工具存在以下问题：

| 问题 | 说明 |
|------|------|
| 枚举类型转换错误 | 枚举被错误转换为 `number` |
| 特殊类型未映射 | `bigint`/`integer`/`array` 未正确映射到 TypeScript 类型 |
| 嵌套对象未展开 | 关联对象类型未生成具体结构 |
| 字段缺失 | 部分字段在生成时丢失 |

---

## 修复计划

1. **短期**：前端使用 `as any` 类型断言临时绕过
2. **中期**：修复 `moyan-api` 生成工具的类型映射逻辑
3. **长期**：完善 OpenAPI 规范，确保类型定义完整

---

## 相关文件

- `packages/base-frontend/src/plugins/api.ts` - moyan-api 适配器配置
- `packages/base-frontend/src/plugins/index.ts` - 插件入口
- `packages/base-frontend/src/apis/sys/index.ts` - API 类定义
- `packages/base-frontend/src/apis/sys/schemas.ts` - 类型定义
- `docs/03-框架规范/01-前端规范/06-API 调用规范.md` - API 调用规范文档

---

## moyan-api 包发布问题

**问题类型**：npm 包发布遗漏

**版本追踪**：
| 版本 | package.json types 字段 | dist 目录状态 | 问题 |
|------|-------------------------|---------------|------|
| 1.0.84 | `"types": "src"` | ❌ 不存在 | 配置错误 + 编译产物缺失 |
| 1.0.85 | `"types": "./dist/index.d.ts"` | ❌ 不存在 | 配置已修复，但编译产物未发布 |
| 1.1.1 | `"types": "./dist/index.d.ts"` | ✅ 存在 | **已修复** |

**当前状态**（moyan-api 1.1.1）：
- ✅ package.json 配置正确
- ✅ dist 目录已包含在 npm 发布中
- ✅ 构建和类型检查正常通过

**导入方式变更**：
```typescript
// 旧版（1.0.84/1.0.85）- 源码路径
import { ApiEvents } from 'moyan-api/src/lib/base';

// 新版（1.1.1）- dist 路径
import { ApiEvents } from 'moyan-api/dist/lib/base';

// 或者从主入口导入（ApiEvents 未在主入口导出，需使用 dist 路径）
import { ApiCall, ApiEntity } from 'moyan-api';
```

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.4.0 | 2026-04-01 | moyan-api 1.1.1 已修复，更新导入路径，状态改为已解决 |
| 1.3.0 | 2026-04-01 | 更新 moyan-api 1.0.85 状态：配置已修复但 dist 目录未发布 |
| 1.2.0 | 2026-04-01 | 添加 moyan-api 包发布问题（types 字段配置错误） |
| 1.1.0 | 2026-04-01 | 添加 moyan-api 正确用法说明，添加适配器配置文件路径 |
| 1.0.0 | 2026-04-01 | 初始版本，记录 6 类类型定义问题 |
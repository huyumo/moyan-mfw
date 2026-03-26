# 通用类型定义

> 本文档定义各接口文档复用的数据类型
>
> **实体定义**: [database-entities-design.md](../database/database-entities-design.md)

---

## 统一响应结构

```typescript
interface ApiResponse<T = any> {
  code: number;                  // 状态码：0-成功，其他 - 失败
  data: T;                       // 响应数据
  message?: string;              // 错误消息
}
```

---

## 分页相关

```typescript
// 分页请求参数
interface PaginationParams {
  page?: number;                 // 页码，默认 1
  pageSize?: number;             // 每页数量，默认 10
}

// 分页响应数据
interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## 权限树相关

```typescript
// 权限树节点（返回数据）
interface PermissionTreeNode {
  id: string;
  permName: string;
  permCode: string;
  permDesc?: string;
  permissionType: 'PC' | 'NORMAL';
  nodeType: 'MENU' | 'PAGE' | 'TAG';
  parentId?: string;
  routePath?: string;
  componentPath?: string;
  iconName?: string;
  sortOrder: number;
  isVisible: number;
  isCache: number;
  showMode: 'NORMAL' | 'DEV';
  permStatus: number;
  pcAction?: Array<{
    name: string;
    permCode: string;
  }>;
  // 配置状态（由后端根据上下文填充）
  inPool?: boolean;              // 是否在权限池中
  assigned?: boolean;            // 是否已分配给角色
  children?: PermissionTreeNode[];
}

// 权限树请求体（树形结构）
interface PermissionTreePayload {
  permissionId: string;
  checked: boolean;              // true=选中，false=取消
  pcAction?: Array<{
    permCode: string;
    checked: boolean;
  }>;
  children?: PermissionTreePayload[];
}
```

---

## 用户相关

```typescript
// 用户信息（列表项摘要）
interface UserInfo {
  id: string;
  username: string;
  nickname?: string;
  phone?: string;
  avatar?: string;
}

// 用户详情（完整信息）
interface UserDetail extends UserInfo {
  email?: string;
  gender: number;                // 0-未知 1-男 2-女
  userStatus: number;            // 1-启用 0-禁用
  isDeveloper?: number;          // 1-是 0-否
  createAt: string;
  updateAt?: string;
}
```

---

## 应用类型相关

```typescript
// 应用类型摘要（用于列表项）
interface AppTypeBasic {
  id: string;
  typeName: string;
  typeCode: string;
}

// 应用类型详情
interface AppTypeDetail extends AppTypeBasic {
  typeDesc?: string;
  icon?: string;
  multiAppEnabled: number;
  typeStatus: number;
  sortOrder: number;
  createAt: string;
  updateAt?: string;
}
```

---

## 应用相关

```typescript
// 应用摘要（用于列表项）
interface AppBasic {
  id: string;
  appName: string;
  appCode: string;
  ownerId: string;
}

// 应用详情
interface AppDetail extends AppBasic {
  appTypeId: string;
  appDesc?: string;
  appLogo?: string;
  appStatus: number;
  sortOrder: number;
  createAt: string;
  updateAt?: string;
}
```

---

## 角色相关

```typescript
// 角色摘要（用于列表项）
interface RoleBasic {
  id: string;
  roleName: string;
  roleCode: string;
  isBuiltin: number;
  isOwner: number;
}

// 角色详情
interface RoleDetail extends RoleBasic {
  appId?: string;
  appTypeId?: string;
  roleDesc?: string;
  roleStatus: number;
  sortOrder: number;
  createAt: string;
  updateAt?: string;
}
```

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-26 | 初始版本 |

---

*本文档由基础设施页面详细设计文档拆分而来*

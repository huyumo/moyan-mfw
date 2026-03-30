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
// 权限树节点（返回数据）- 所有文档统一引用此定义
interface PermissionTreeNode {
  // 基础字段
  id: string;
  permName: string;
  permCode: string;
  permDesc?: string;
  permissionType: 'PC' | 'NORMAL';
  nodeType: 'MENU' | 'PAGE' | 'TAG';
  parentId?: string;

  // 路由相关
  routePath?: string;            // v3.0 新增 - 同步功能使用
  externalUrl?: string;          // v5.0 新增 - 外部链接
  iconName?: string;

  // 配置字段
  sortOrder: number;
  isVisible: number;
  isCache: number;
  showMode: 'NORMAL' | 'DEV';
  permStatus: number;
  isAutoSync?: number;           // v3.0 新增 - 1=同步生成 0=手动添加

  // 操作权限（PC 权限的 PAGE 节点、普通权限的 TAG 节点有效）- v4.0 改为位运算
  permissionValue?: bigint;      // 位运算权限值，如 7n = ADD|EDIT|DELETE

  // 配置状态（由后端根据上下文填充）
  inPool?: boolean;              // 是否在权限池中
  assigned?: boolean;            // 是否已分配给角色

  children?: PermissionTreeNode[];
}

// 权限树请求体（树形结构）- 所有文档统一引用此定义
interface PermissionTreePayload {
  permissionId: string;
  checked: boolean;              // true=选中，false=取消
  permissionValue?: bigint;      // v4.0 新增 - 位运算权限值
  children?: PermissionTreePayload[];
}
```

**约定式路由规则 (v5.0)**:

- `componentPath` 字段已移除，组件路径由前端根据 `permCode` 自动推导
- 推导规则：`permCode` = 路由路径 = 组件目录
  - 路由路径：`/${permCode}`
  - 组件路径：`src/views/${permCode}/Index.vue`
- 示例：
  - `permCode = "system/user-list"` → 路由 `/system/user-list` → 组件 `src/views/system/user-list/Index.vue`
  - `permCode = "business/order/manage"` → 路由 `/business/order/manage` → 组件 `src/views/business/order/manage/Index.vue`

**外部链接处理**:
- `externalUrl` 有值时，表示该权限节点指向外部链接
- 前端根据 URL 协议判断处理方式：
  - `http://` 或 `https://` → 新窗口打开或 iframe 嵌入
  - `iframe://` 开头 → 移除前缀后用 iframe 嵌入

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

## 数据类型说明

| 类型 | 数据库类型 | API 返回格式 | 说明 |
|------|-----------|-------------|------|
| Date | datetime(3) | string | ISO 8601 格式，如 "2026-03-26T10:00:00.000Z" |
| number | int/tinyint | number | 整数类型 |
| string | varchar | string | 字符串类型 |
| bigint | bigint | string | **位运算权限值**（permissionValue）：后端使用 bigint 存储，API 返回时转换为**十进制数字字符串**，前端使用 `BigInt()` 转换后参与位运算 |

---

## permissionValue 序列化说明

**bigint 类型在 JSON 中无法直接传输**，系统采用以下序列化方式：

### 后端 → 前端（响应数据）

```typescript
// 数据库存储：permissionValue = 7n (bigint)
// API 响应：转换为十进制字符串
{
  permissionId: "perm-001",
  permissionValue: "7"    // 字符串格式，非数字
}

// 前端处理：使用 BigInt() 转换
const permValue = BigInt(response.permissionValue)  // "7" → 7n
const hasAddPermission = (permValue & 1n) !== 0n   // 位运算检查
```

### 前端 → 后端（请求数据）

```typescript
// 前端请求：使用字符串或 BigInt 字面量
{
  permissionId: "perm-001",
  permissionValue: "7"    // 方式 1：字符串（推荐）
  // 或
  permissionValue: 7n     // 方式 2：BigInt 字面量（需要 TS 支持）
}

// 后端处理：解析为 bigint
const permValue = BigInt(request.permissionValue)  // "7" → 7n
```

### 常用 permissionValue 示例

| 操作组合 | 位运算表达式 | 十进制值 | API 传输值 |
|----------|-------------|---------|-----------|
| ADD | `1n` | 1 | `"1"` |
| ADD \| EDIT | `1n \| 2n` | 3 | `"3"` |
| ADD \| EDIT \| DELETE | `1n \| 2n \| 4n` | 7 | `"7"` |
| ADD \| EDIT \| DELETE \| EXPORT | `1n \| 2n \| 4n \| 8n` | 15 | `"15"` |
| 全权限 (10 位) | `1023n` | 1023 | `"1023"` |

### 注意事项

1. **不要使用 JSON.stringify() 直接序列化 bigint**，会抛出错误
2. **前后端统一使用字符串传输**，避免精度丢失
3. **前端必须进行类型转换**：`BigInt(value)` 后才能参与位运算
4. **后端必须解析字符串**：`new BigDecimal(value)` 或 `BigInteger.valueOf()`

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-26 | 初始版本 |
| 1.1.0 | 2026-03-26 | 统一 PermissionTreeNode 定义，添加数据类型说明 |

---

*本文档由基础设施页面详细设计文档拆分而来*

# API 设计规范

> 状态：**已完成** | 版本：2.0.0 | 最后更新：2026-03-30

---

## 3.1 RESTful 规范

### 3.1.1 路径命名

```
✅ 推荐：
GET    /api/v1/users              # 获取用户列表
POST   /api/v1/users              # 创建用户
GET    /api/v1/users/:id          # 获取用户详情
PUT    /api/v1/users/:id          # 更新用户
DELETE /api/v1/users/:id          # 删除用户
GET    /api/v1/users/:id/roles    # 获取用户角色列表
PUT    /api/v1/users/:id/roles    # 更新用户角色

❌ 避免：
GET    /api/v1/getUserList        # 不要用动词
POST   /api/v1/createUser         # 动词在 HTTP 方法中体现
GET    /api/v1/user-info          # 使用复数名词
```

### 3.1.2 版本控制

```typescript
// URL 路径版本控制（推荐）
/api/v1/users
/api/v2/users

// 请求头版本控制（可选）
Accept: application/vnd.moyan.v1+json
```

### 3.1.3 资源嵌套

```typescript
// 一级资源
GET /api/v1/users

// 二级嵌套资源（用户的角色）
GET /api/v1/users/:userId/roles

// 三级嵌套资源（用户在某角色的权限）
GET /api/v1/users/:userId/roles/:roleId/permissions

// ⚠️ 避免超过三级嵌套，考虑扁平化
// ❌ 避免：/api/v1/users/:userId/roles/:roleId/permissions/:permId/actions
// ✅ 推荐：/api/v1/permission-actions/:permId
```

---

## 3.2 请求/响应格式

### 3.2.1 统一响应结构

```typescript
interface ApiResponse<T = any> {
  code: number;          // 状态码：0-成功，其他 - 失败
  data: T;               // 响应数据
  message?: string;      // 错误消息（失败时）
}

// 成功响应示例
{
  "code": 0,
  "data": {
    "id": "uuid-123",
    "username": "test"
  },
  "message": "操作成功"
}

// 失败响应示例
{
  "code": 10001,
  "data": null,
  "message": "用户名已存在"
}
```

### 3.2.2 分页响应

```typescript
interface PaginatedResponse<T> {
  list: T[];             // 数据列表
  total: number;         // 总数
  page: number;          // 当前页码
  pageSize: number;      // 每页数量
}

// 分页响应示例
{
  "code": 0,
  "data": {
    "list": [
      { "id": "1", "username": "test1" },
      { "id": "2", "username": "test2" }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### 3.2.3 分页请求参数

```typescript
interface PaginationParams {
  page?: number;         // 页码，默认 1
  pageSize?: number;     // 每页数量，默认 10
}

// 请求示例
GET /api/v1/users?page=1&pageSize=20
```

### 3.2.4 请求头规范

```typescript
// 必需请求头
Authorization: Bearer <token>     // 认证请求头
Content-Type: application/json    // 内容类型
X-Request-ID: uuid-123           // 可选：请求 ID（用于追踪）

// 响应头
Content-Type: application/json; charset=utf-8
X-Total-Count: 100                // 列表接口返回总数
X-Request-ID: uuid-123            // 请求 ID（用于追踪）
```

---

## 3.3 错误码规范

### 3.3.1 错误码定义

```typescript
// 通用错误码
enum ErrorCode {
  SUCCESS = 0,                    // 成功
  BAD_REQUEST = 40000,            // 请求参数错误
  UNAUTHORIZED = 40100,           // 未授权
  FORBIDDEN = 40300,              // 禁止访问
  NOT_FOUND = 40400,              // 资源不存在
  INTERNAL_ERROR = 50000,         // 服务器内部错误
}

// 业务错误码（按模块划分）
enum UserErrorCode {
  USER_NOT_FOUND = 10001,         // 用户不存在
  USER_NAME_EXISTS = 10002,       // 用户名已存在
  PASSWORD_ERROR = 10003,         // 密码错误
}

enum RoleErrorCode {
  ROLE_NOT_FOUND = 20001,         // 角色不存在
  ROLE_NAME_EXISTS = 20002,       // 角色名已存在
  ROLE_HAS_USERS = 20003,         // 角色下有关联用户
}

enum PermissionErrorCode {
  PERMISSION_NOT_FOUND = 30001,   // 权限不存在
  PERMISSION_DENIED = 30002,      // 权限不足
  INVALID_PERMISSION_VALUE = 30003, // 权限值无效
}
```

### 3.3.2 错误响应格式

```typescript
// 简单错误响应
{
  "code": 10002,
  "data": null,
  "message": "用户名已存在"
}

// 带详细信息的错误响应
{
  "code": 40000,
  "data": null,
  "message": "请求参数验证失败",
  "details": [
    {
      "field": "username",
      "message": "用户名长度必须在 4-20 之间"
    },
    {
      "field": "phone",
      "message": "手机号格式不正确"
    }
  ]
}
```

### 3.3.3 错误码编排规则

```typescript
// 错误码格式：XXYYY
// XX - 模块编号
// YYY - 具体错误编号

// 模块编号分配：
// 00 - 通用错误
// 01 - 认证模块
// 10 - 用户模块
// 20 - 角色模块
// 30 - 权限模块
// 40 - 应用模块
// 50 - 审计日志模块
```

---

## 3.4 数据验证规范

### 3.4.1 请求体验证

```typescript
// 创建用户请求体
interface CreateUserRequest {
  username: string;      // 必填，4-20 字符
  password: string;      // 必填，6-20 字符
  nickname?: string;     // 可选，最大 50 字符
  phone?: string;        // 可选，手机号格式
  email?: string;        // 可选，邮箱格式
}

// 验证规则示例（使用 class-validator）
import {
  IsString,
  Length,
  IsOptional,
  IsEmail,
  Matches
} from 'class-validator';

class CreateUserDto {
  @IsString()
  @Length(4, 20)
  username: string;

  @IsString()
  @Length(6, 20)
  password: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  nickname?: string;

  @IsOptional()
  @Matches(/^1[3-9]\d{9}$/)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
```

### 3.4.2 验证错误响应

```typescript
// 验证错误响应示例
{
  "code": 40000,
  "data": null,
  "message": "请求参数验证失败",
  "details": [
    {
      "field": "username",
      "message": "用户名长度必须在 4-20 之间"
    },
    {
      "field": "phone",
      "message": "手机号格式不正确"
    }
  ]
}
```

---

## 3.5 权限验证规范

### 3.5.1 注解式权限验证

```typescript
// Java/Spring Boot 示例
@RequirePermission(permCode = "system.user-list", perm = Perm.DELETE)
@DeleteMapping("/users/{id}")
public ApiResponse<Void> deleteUser(@PathVariable String id) {
  userService.deleteUser(id);
  return ApiResponse.success();
}

// Node.js/NestJS 示例
@Delete('users/:id')
@RequirePermission('system.user-list', Perm.DELETE)
async deleteUser(@Param('id') id: string): Promise<ApiResponse<void>> {
  await this.userService.deleteUser(id);
  return ApiResponse.success();
}
```

### 3.5.2 权限位定义

```typescript
// 全局权限位枚举
enum Perm {
  ADD     = 1n,    // 新增
  EDIT    = 2n,    // 编辑
  DELETE  = 4n,    // 删除
  EXPORT  = 8n,    // 导出
  IMPORT  = 16n,   // 导入
  VIEW    = 32n,   // 查看
  APPROVE = 64n,   // 审批
  REJECT  = 128n,  // 拒绝
}
```

---

## 检查清单

### API 设计检查

- [ ] 路径使用复数名词
- [ ] 使用 HTTP 方法表达操作
- [ ] 包含版本号
- [ ] 统一响应结构
- [ ] 错误码定义清晰
- [ ] 分页参数规范

### 代码实现检查

- [ ] 请求体验证完整
- [ ] 事务注解正确
- [ ] 异常处理完善
- [ ] 日志记录规范
- [ ] 权限验证到位
- [ ] 类型定义完整

---

## 相关文档

- [API 接口索引](../../01-业务需求/01-基础设施/06-API 接口/API 接口索引.md) - 业务 API 定义
- [权限安全规范](./05-权限安全规范.md) - 权限验证实现
- [数据库规范](./04-数据库规范.md) - 数据库实体设计
- [统一类型定义](../../01-业务需求/01-基础设施/06-API 接口/统一类型定义.md) - 通用类型定义

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 2.0.0 | 2026-03-30 | 从 Git 历史恢复并补充完整内容 |
| 1.0.0 | 2026-03-28 | 初始版本（草案） |

---
name: api-spec-rule
description: API 接口开发强制规范 - 确保符合文档定义
type: project
---

# API 接口开发规范

> 状态：**强制执行** | 创建：2026-04-02

---

## 开发前必读

**开发任何 API 接口前，必须读取以下文档**：
1. `docs/01-业务需求/01-基础设施/06-API 接口/统一类型定义.md`
2. `docs/01-业务需求/01-基础设施/06-API 接口/[对应模块]接口.md`

---

## API 路径规范

### 版本号

所有 API 必须包含版本号前缀 `/api/v1/`：

```
✅ 正确：/api/v1/users/search
❌ 错误：/api/users/search
❌ 错误：/users/search
```

### 命名规范

| 操作 | 路径格式 | 示例 |
|------|----------|------|
| 列表查询 | `/api/v1/{resource}` | `/api/v1/users` |
| 搜索 | `/api/v1/{resource}/search` | `/api/v1/users/search` |
| 详情 | `/api/v1/{resource}/{id}` | `/api/v1/users/123` |
| 创建 | `/api/v1/{resource}` | `POST /api/v1/users` |
| 更新 | `/api/v1/{resource}/{id}` | `PUT /api/v1/users/123` |
| 删除 | `/api/v1/{resource}/{id}` | `DELETE /api/v1/users/123` |
| 状态更新 | `/api/v1/{resource}/{id}/status` | `PUT /api/v1/users/123/status` |

---

## 统一响应结构

### 成功响应

```typescript
{
  code: 0,                    // 必须为 0
  data: T,                    // 业务数据
  message?: string            // 可选消息
}
```

### 分页响应

```typescript
{
  code: 0,
  data: {
    list: T[],                // 数据列表
    total: number,            // 总数量
    page: number,             // 当前页码
    pageSize: number          // 每页数量
  }
}
```

### 错误响应

```typescript
{
  code: number,               // 非 0 错误码
  data: null,
  message: string             // 错误消息
}
```

---

## 类型定义规范

### 必须遵循文档

开发时必须对照 `统一类型定义.md`：

| 类型 | 文档定义 | 说明 |
|------|----------|------|
| Date | datetime(3) | ISO 8601 格式字符串 |
| permissionType | 'PC' \| 'NORMAL' | 枚举类型 |
| nodeType | 'MENU' \| 'PAGE' \| 'TAG' | 枚举类型 |
| permissionValue | bigint | 位运算权限值 |

### bigint 序列化

```typescript
// 后端 → 前端
// 数据库: permissionValue = 7n
// API 响应: permissionValue: "7"  (字符串)

// 前端处理
const permValue = BigInt(response.permissionValue)
```

---

## 开发检查清单

### 后端开发

- [ ] Controller 路径是否有版本号 `/api/v1/`
- [ ] DTO 是否与文档定义一致
- [ ] 响应格式是否符合 ApiResponse 结构
- [ ] 类型定义是否正确（枚举、bigint 等）
- [ ] 是否有 Swagger 文档

### 前端开发

- [ ] API 路径是否与后端一致
- [ ] 请求/响应类型是否与后端 DTO 一致
- [ ] bigint 字段是否正确处理

---

## 禁止行为

| 禁止项 | 原因 | 替代方案 |
|--------|------|----------|
| 省略版本号 | 不符合规范 | 使用 `/api/v1/` |
| 自定义响应格式 | 不统一 | 使用 ApiResponse |
| bigint 直接传输 | JSON 不支持 | 使用字符串 |

---

## 验证命令

```bash
# 检查后端 API 路径
grep -r "@Controller" packages/base-backend/src/

# 检查前端 API 路径
grep -r "path = '/api/" packages/base-frontend/src/apis/
```

---

**维护**: @tech-lead | **强制**: 所有 API 开发任务
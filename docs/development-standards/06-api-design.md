# 06 · API 设计规范

## apis 目录红线

> **禁止手动编写或改动 `apis` 目录下的任何文件。**

`apis` 目录存放的是由 `moyan-api` 工具自动生成的 API 代码。任何手动修改都会被后续生成覆盖。

### 正确做法

| 需求 | 做法 |
|------|------|
| API 返回类型不正确 | 修改后端 DTO/响应类型 → 运行 `pnpm run api:build` |
| 需要新增 API 方法 | 在后端新增 Controller 方法 → 运行 `pnpm run api:build` |
| API 路径不对 | 修改后端 Controller 路由 → 运行 `pnpm run api:build` |

### 重新生成

```bash
pnpm run api:build
```

---

## 权限编码规则

- 格式：`pc_root:sys:模块名`（PC 端管理权限前缀）
- 小写 + 冒号分隔：`pc_root:sys:order-management`
- 当前已有编码：`user` / `role` / `permission` / `permission-pc` / `app-type` / `app` / `member` / `audit-log`
- 新增模块须在 `common/constants/permissions.ts` 中添加权限编码

---

## 响应格式

### 成功响应（TransformInterceptor 自动包装）

```json
{
  "code": 0,
  "data": { ... },
  "message": "success",
  "timestamp": "2026-05-18T12:00:00.000Z"
}
```

### 分页响应

```json
{
  "code": 0,
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "message": "success",
  "timestamp": "..."
}
```

### 错误响应

```json
{
  "code": 10001,
  "message": "参数验证失败",
  "data": null,
  "timestamp": "...",
  "path": "/api/users/list",
  "details": [
    { "field": "name", "message": "name must be a string" }
  ]
}
```

---

## Controller API 设计约定

- GET `/api/xxx` — 分页列表查询
- GET `/api/xxx/:id` — 单条详情
- POST `/api/xxx` — 创建
- PATCH `/api/xxx/:id` — 更新
- DELETE `/api/xxx/:id` — 删除（软删除）

### 扩展包路由

扩展包的 API 自动添加 `/ext/{name}` 前缀：

- GET `/api/ext/ad/placements` — 广告扩展的广告位列表

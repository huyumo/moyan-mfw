# 应用管理接口

> **相关页面**: [应用管理页面](../pages/app-management.md)
>
> **数据结构**: [AppEntity](../database/database-entities-design.md#12-appentity-应用实例实体)
>
> **复用接口**: [搜索用户](./user-api.md#1-搜索用户)

---

## 接口概览

| 接口 | 方法 | 使用场景 |
|------|------|----------|
| `/api/v1/apps` | GET | 应用列表页加载 |
| `/api/v1/apps` | POST | 创建应用 |
| `/api/v1/apps/:id` | GET | 应用详情页加载 |
| `/api/v1/apps/:id` | PUT | 编辑应用基本信息 |
| `/api/v1/apps/:id` | DELETE | 删除应用 |

**认证要求**:

除特别说明外，本接口所有请求均需在请求头中携带认证 Token：
```
Authorization: Bearer <token>
```

---

## 1. 获取应用列表

**接口**: `GET /api/v1/apps`

**使用场景**: 应用列表页加载，展示应用表格。

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |
| appTypeId | string | 否 | 应用类型筛选 |
| appStatus | number | 否 | 状态筛选：1-启用 0-禁用 |

**返回数据**:

```typescript
{
  code: number;
  data: {
    list: Array<App & {
      appType: Pick<AppType, 'id' | 'typeName' | 'typeCode'>;
      owner: Pick<User, 'id' | 'username' | 'nickname' | 'avatar'>;
    }>;
    total: number;
    page: number;
    pageSize: number;
  };
  message?: string;
}
```

---

## 2. 创建应用

**接口**: `POST /api/v1/apps`

**使用场景**: 点击新建应用按钮，填写表单后保存。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appTypeId | string | 是 | 应用类型 ID |
| appName | string | 是 | 应用名称 |
| appCode | string | 是 | 应用编码（全局唯一） |
| ownerId | string | 是 | 拥有者 ID |
| appDesc | string | 否 | 应用描述 |
| appLogo | string | 否 | 应用标识图 |
| sortOrder | number | 否 | 排序值 |

```typescript
{
  appTypeId: string;
  appName: string;
  appCode: string;
  ownerId: string;
  appDesc?: string;
  appLogo?: string;
  sortOrder?: number;
}
```

**返回数据**:

```typescript
{
  code: number;
  data: App;
  message?: string;
}
```

---

## 3. 获取应用详情

**接口**: `GET /api/v1/apps/:id`

**使用场景**: 点击应用详情按钮，展示应用详细信息及拥有者信息。

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 应用 ID |

**返回数据**:

```typescript
{
  code: number;
  data: App & {
    appType: AppType;
    owner: User;
  };
  message?: string;
}
```

---

## 4. 更新应用

**接口**: `PUT /api/v1/apps/:id`

**使用场景**: 编辑应用基本信息，或变更拥有者。

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 应用 ID |

**请求体** (字段均可选):

```typescript
{
  appName?: string;
  appDesc?: string;
  appLogo?: string;
  ownerId?: string;            // 变更拥有者
  appStatus?: number;
  sortOrder?: number;
}
```

**返回数据**:

```typescript
{
  code: number;
  data: App;
  message?: string;
}
```

---

## 5. 删除应用

**接口**: `DELETE /api/v1/apps/:id`

**使用场景**: 点击删除应用按钮，确认后调用。

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 应用 ID |

**返回数据**:

```typescript
{
  code: number;
  data: null;
  message?: string;
}
```

---

## 6. 搜索用户

**接口**: `GET /api/v1/users/search`

**使用场景**: 创建应用或变更拥有者时，通过手机号/用户名搜索用户。

> **注意**: 此接口为复用接口，详细文档见 [用户接口 - 搜索用户](./user-api.md#1-搜索用户)

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词（手机号/用户名/昵称） |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |

**返回数据**:

```typescript
{
  code: number;
  data: {
    list: Array<{
      id: string;
      username: string;
      nickname?: string;
      phone?: string;
      avatar?: string;
    }>;
    total: number;
  };
  message?: string;
}
```

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-26 | 初始版本 |

---

*本文档由基础设施页面详细设计文档拆分而来*

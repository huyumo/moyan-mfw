# 用户接口

> **相关页面**: 应用管理页面、成员管理页面、用户注册页
>
> **数据结构**: [UserEntity](../database/database-entities-design.md#15-userentity-用户实体)

---

## 接口概览

| 接口 | 方法 | 使用场景 |
|------|------|----------|
| `/api/v1/users/search` | GET | 搜索用户（选择拥有者/添加成员） |
| `/api/v1/users/register` | POST | 用户注册 |

---

## 1. 搜索用户

**接口**: `GET /api/v1/users/search`

**使用场景**:
- 应用管理：创建应用或变更拥有者时，通过手机号/用户名搜索用户
- 成员管理：添加成员时，通过手机号搜索用户

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

## 2. 用户注册

**接口**: `POST /api/v1/users/register`

**使用场景**: 用户在注册页输入账号密码进行注册。

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名（全局唯一） |
| password | string | 是 | 密码 |
| nickname | string | 否 | 昵称 |
| phone | string | 否 | 手机号（全局唯一） |

```typescript
{
  username: string;
  password: string;
  nickname?: string;
  phone?: string;
}
```

**返回数据**:

```typescript
{
  code: number;
  data: {
    id: string;
    username: string;
    nickname?: string;
    phone?: string;
    userStatus: number;        // 1-启用 0-禁用
    createAt: string;
  };
  message?: string;
}
```

**说明**:
- 注册后的用户默认 `userStatus = 1`（启用状态）
- 新用户需要被分配到应用并绑定角色后才能访问系统功能
- 用户名和手机号全局唯一，注册时需验证

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-26 | 初始版本 |
| 1.1.0 | 2026-03-26 | 添加用户注册接口 |

---

*本文档由基础设施页面详细设计文档拆分而来*

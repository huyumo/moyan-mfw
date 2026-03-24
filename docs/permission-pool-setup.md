# 权限池配置流程文档

## 概述

本文档描述应用类型权限池配置的详细流程和核心业务规则。

**模块路径**:
- 前端：`packages/base-frontend/src/app/pages/permission/`
- 后端：`packages/base-backend/src/services/`

**版本**: 2.0.0

---

## 目录

1. [完整流程图](#完整流程图)
2. [权限池验证逻辑](#权限池验证逻辑)
3. [权限池与角色权限关系](#权限池与角色权限关系)
4. [并发处理机制](#并发处理机制)
5. [API 接口](#API 接口)
6. [业务规则](#业务规则)
7. [pcAction 数据流](#pcAction 数据流)

---

## 完整流程图

```mermaid
sequenceDiagram
    autonumber
    participant U as 用户
    participant P as 前端页面<br/>(AppTypeDetailPage)
    participant A as API 服务<br/>(PermissionApi)
    participant S as 后端服务<br/>(AppTypeService)
    participant D as 数据库<br/>(MySQL)

    rect rgb(230, 240, 255)
        note right of U: 阶段 1: 进入权限池配置
        U->>P: 进入应用类型详情页
        P->>A: GET /sys/app-type/:code
        A->>S: getByCode(typeCode)
        S->>D: 查询 app_type 详情
        S->>D: 查询 builtin_roles
        S->>D: 查询 permissions (含关联字段)
        D-->>S: 返回完整数据
        S-->>A: 返回 AppTypeDetail
        A-->>P: JSON 响应
        P->>P: 渲染 PermissionPoolPanel
        P->>U: 显示权限池配置界面
    end

    rect rgb(240, 250, 230)
        note right of U: 阶段 2: 加载各类权限
        U->>P: 切换到"PC 权限树"Tab
        P->>A: GET /sys/permission/tree?type=PC
        A->>S: getTree({permissionType: PC})
        S->>D: 查询 PC 权限树
        D-->>S: 返回 PermissionItem[]
        S-->>A: 返回树形数据
        A-->>P: 渲染 PcPermissionTreeSelect

        U->>P: 切换到"普通权限"Tab
        P->>A: GET /sys/permission/list?type=NORMAL
        A->>S: getList(params, {permissionType: NORMAL})
        S->>D: 分页查询普通权限
        D-->>S: 返回 PageResult
        S-->>A: 返回数据
        A-->>P: 渲染复选框列表

        U->>P: 切换到"OpenAPI"Tab
        P->>A: GET /sys/permission/tree?type=API
        A->>S: getTree({permissionType: API})
        S->>D: 查询 API 权限树
        D-->>S: 返回 PermissionItem[]
        S-->>A: 返回树形数据
        A-->>P: 渲染 ApiPermissionTreeSelect
    end

    rect rgb(255, 240, 240)
        note right of U: 阶段 3: 保存权限池配置
        U->>P: 勾选/取消勾选权限
        U->>P: 点击 PAGE 节点展开 pcAction
        U->>P: 勾选/取消勾选 pcAction
        U->>P: 点击"保存"按钮

        P->>P: 合并三类权限编码
        P->>P: 收集勾选的 pcAction
        P->>P: 去重 + 过滤
        P->>A: POST /sys/app-type/:code/permissions<br/>{permissions: [{permissionId, pcAction[]}]}
        A->>S: assignPermissions(typeCode, dto)

        note right of S: 事务处理开始
        S->>D: BEGIN TRANSACTION
        S->>D: DELETE FROM sys_app_type_permission<br/>WHERE appTypeId = ?
        D-->>S: 删除成功

        loop 遍历权限配置
            S->>D: 查询 permissionId by permCode
            D-->>S: 返回 permissionId
            S->>D: INSERT INTO sys_app_type_permission<br/>(appTypeId, permissionId, pcAction)
            D-->>S: 插入成功
        end

        S->>D: COMMIT
        note right of S: 事务处理结束

        S-->>A: 返回成功
        A-->>P: JSON 响应
        P->>P: 重新加载权限池
        P->>U: 显示"保存成功"提示
    end
```

---

## 权限池验证逻辑

```mermaid
flowchart TD
    Start[开始保存权限池] --> CollectCodes[收集权限配置]

    CollectCodes --> MergeCodes[合并 PC + 普通 + API]
    MergeCodes --> Dedup[去重 + 过滤空值]

    Dedup --> EmptyCheck{权限列表为空？}
    EmptyCheck -->|是 | AllowEmpty{允许空池？}
    AllowEmpty -->|是 | Proceed[继续处理]
    AllowEmpty -->|否 | ShowError1[显示"至少选择一个权限"]
    ShowError1 --> End1([结束])

    EmptyCheck -->|否 | ValidateCodes[验证权限编码有效性]
    ValidateCodes --> QueryDB[批量查询权限表]
    QueryDB --> CompareCount{数量匹配？}

    CompareCount -->|否 | ShowError2[显示"存在无效权限编码<br/>" + 缺失列表]
    ShowError2 --> End2([结束])

    CompareCount -->|是 | CheckAppType{应用类型存在？}
    CheckAppType -->|否 | ShowError3[显示"应用类型不存在"]
    ShowError3 --> End3([结束])

    CheckAppType -->|是 | ValidatePcAction[验证 pcAction 有效性]
    ValidatePcAction --> QueryPermission[查询权限的 pcAction 定义]
    QueryPermission --> CheckPcAction{pcAction 在定义内？}

    CheckPcAction -->|否 | ShowError4[显示"存在无效的 pcAction"]
    CheckPcAction -->|是 | StartTransaction[开启事务]

    StartTransaction --> DeleteOld[删除旧关联记录]
    DeleteOld --> BatchInsert[批量插入新关联]

    BatchInsert --> VerifyInsert{插入成功？}
    VerifyInsert -->|否 | Rollback[回滚事务]
    Rollback --> ShowError5[显示"数据库写入失败"]
    ShowError5 --> End4([结束])

    VerifyInsert -->|是 | Commit[提交事务]
    Commit --> Success[返回成功]
    Success --> End5([完成])
```

---

## 权限池与角色权限关系

```mermaid
graph TB
    subgraph 权限池配置
        P1[PC 权限树选择] --> P4[权限编码集合 + pcAction]
        P2[普通权限选择] --> P4
        P3[OpenAPI 权限选择] --> P4
        P4 --> P5[保存到 sys_app_type_permission]
    end

    subgraph 角色权限分配
        R1[从权限池选择] --> R4[角色权限集合 + pcAction 子集]
        R4 --> R5[保存到 sys_role_permission]
    end

    subgraph 运行时验证
        V1[用户请求权限] --> V2{检查角色权限}
        V2 --> V3{检查权限池包含}
        V3 -->|是 | V4[允许访问]
        V3 -->|否 | V5[拒绝访问]
    end

    P5 -.->|约束范围 | R1
    R5 -.->|用于 | V1
```

**说明**:
- 权限池配置是角色权限分配的前提
- 角色权限必须是权限池的子集（包括 pcAction）
- 运行时权限验证先检查角色权限，再检查权限池包含

---

## 并发处理机制

```mermaid
sequenceDiagram
    participant U1 as 用户 A
    participant U2 as 用户 B
    participant S as AppTypeService
    participant D as Database

    U1->>S: assignPermissions(typeCode, dto1)
    activate S
    S->>D: BEGIN TRANSACTION
    S->>D: DELETE FROM sys_app_type_permission WHERE appTypeId = ?
    Note over S,D: 事务 1 执行中

    U2->>S: assignPermissions(typeCode, dto2)
    activate S
    Note over U2,S: 等待锁释放

    S->>D: INSERT new permissions...
    S->>D: COMMIT
    deactivate S
    S-->>U1: 成功

    Note over U2,D: 锁释放，事务 2 继续
    S->>D: BEGIN TRANSACTION
    S->>D: DELETE FROM sys_app_type_permission WHERE appTypeId = ?
    S->>D: INSERT new permissions...
    S->>D: COMMIT
    deactivate S
    S-->>U2: 成功
```

**说明**:
- 权限池配置使用事务保证数据一致性
- 同一应用类型的并发配置请求会串行执行
- 后提交的请求会覆盖先提交的配置（Last Write Wins）

---

## API 接口

### 获取应用类型权限池

```
GET /sys/app-type/:code/permissions
Response: {
  permissions: Array<{
    permissionId: string,
    permCode: string,
    permName: string,
    permissionType: string,
    nodeType: string,
    pcAction: Array<{name: string, permCode: string}>
  }>
}
```

### 配置权限池

```
POST /sys/app-type/:code/permissions
Body: {
  permissions: Array<{
    permissionId: string,
    pcAction?: Array<{name: string, permCode: string}>
  }>
}
```

### 获取 PC 权限树

```
GET /sys/permission/tree?permissionType=PC
```

### 获取普通权限列表

```
GET /sys/permission/list?permissionType=NORMAL
```

### 获取 OpenAPI 权限树

```
GET /sys/permission/tree?permissionType=API
```

---

## 业务规则

### 权限池约束

- 权限池通过 `appTypeId` 进行隔离，不同应用类型的权限池相互独立
- 角色权限只能从所属应用类型的权限池中选择
- 权限池为空时，该应用类型下的角色无法分配任何权限

### pcAction 约束

- `pcAction` 仅存储在 `PermissionType=PC` 且 `NodeType=PAGE` 的节点上
- 权限池中的 `pcAction` 必须是对应权限 `pcAction` 定义的子集
- 角色分配权限时，`pcAction` 必须是权限池中 `pcAction` 的子集

### 数据一致性

- 权限池配置使用事务保证数据一致性
- 删除权限池记录时，先删除所有旧记录，再插入新记录
- 插入前验证所有权限编码的有效性和 pcAction 的合法性

### 并发控制

- 同一应用类型的权限池配置请求串行执行
- 数据库行锁保证并发安全
- 后提交的配置覆盖先提交的配置

---

## pcAction 数据流

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. 权限定义 (PermissionEntity)                                  │
│    PAGE 节点：pcAction: [add, edit, delete]                     │
└────────────────────┬────────────────────────────────────────────┘
                     │ 权限池配置时读取并选择子集
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. 权限池 (AppTypePermissionEntity)                             │
│    pcAction: [add, edit]  ← 子集                                │
└────────────────────┬────────────────────────────────────────────┘
                     │ 角色分配权限时读取并选择子集
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. 角色权限 (RolePermissionEntity)                              │
│    pcAction: [add]  ← 子集                                      │
└────────────────────┬────────────────────────────────────────────┘
                     │ 运行时权限验证
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. 用户最终权限 = ∪(所有关联角色的 permissionId + pcAction)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 相关文档

- [数据库实体设计](./database-entities-design.md)
- [应用类型管理页面](./app-type-management.md)
- [角色管理页面](./role-management.md)
- [权限分配流程](./permission-assignment.md)

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 2.0.0 | 2026-03-24 | 重构：添加 pcAction 配置流程，更新 API 接口 |
| 1.0.0 | 2026-03-23 | 初始版本，从基础设施详细设计文档拆分 |

---

*本文档由基础设施页面详细设计文档拆分而来*
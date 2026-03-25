# 权限计算规则文档

## 概述

本文档描述系统权限计算的详细规则和逻辑，包括用户最终权限的计算方式、pcAction 合并规则等。

**版本**: 1.0.0

---

## 目录

1. [权限计算基础](#1-权限计算基础)
2. [用户最终权限计算](#2-用户最终权限计算)
3. [pcAction 合并规则](#3-pcaction 合并规则)
4. [权限验证流程](#4-权限验证流程)
5. [业务规则](#5-业务规则)

---

## 1. 权限计算基础

### 1.1 权限来源

用户的权限来源于其绑定的角色，具体包括：

| 来源 | 说明 | 绑定方式 |
|------|------|----------|
| 拥有者角色 | 每个应用类型必须有一个拥有者角色 (`isOwner=1`)，拥有者自动绑定该角色 | 拥有者变更时自动绑定/解绑 |
| 内置角色 | 应用类型全局角色，绑定 `appTypeId` | 通过成员管理页面分配 |
| 应用级角色 | 应用实例专属角色，绑定 `appId` | 通过成员管理页面分配 |

### 1.2 权限约束

- 所有角色的权限配置都必须从所属应用类型的权限池中选择
- 权限池通过 `appTypeId` 进行隔离，不同应用类型的权限池相互独立
- 角色权限中的 `pcAction` 必须是权限池中对应权限 `pcAction` 的子集

---

## 2. 用户最终权限计算

### 2.1 计算公式

```
用户最终权限 = ∪(用户所有关联角色的权限)
```

### 2.2 计算步骤

```mermaid
flowchart TD
    Start[开始权限计算] --> GetRoles[获取用户所有关联角色]
    GetRoles --> GetPermissions[获取每个角色的权限列表]

    GetPermissions --> MergePermIds[合并所有 permissionId]
    MergePermIds --> GroupByPermId[按 permissionId 分组]

    GroupByPermId --> MergePcAction[合并相同 permissionId 的 pcAction]
    MergePcAction --> Dedup[去重]

    Dedup --> ReturnResult[返回最终权限集合]
    ReturnResult --> End[结束]
```

### 2.3 计算示例

```
用户 U 绑定了以下角色：
- 角色 R1: 拥有者角色
- 角色 R2: 普通员工角色
- 角色 R3: 审计员角色

各角色的权限：
R1 权限 = {
  P1: [pcA1, pcA2, pcA3],  // 用户管理页面
  P2: [pcA1, pcA2],        // 角色管理页面
  P3: [pcA1, pcA2, pcA3]   // 配置管理页面
}

R2 权限 = {
  P1: [pcA1],              // 用户管理页面（只查看）
  P4: [pcA1, pcA2]         // 订单管理页面
}

R3 权限 = {
  P1: [pcA1, pcA2],        // 用户管理页面（查看 + 编辑）
  P5: [pcA1]               // 日志查看页面
}

用户 U 的最终权限 = {
  P1: [pcA1, pcA2, pcA3],  // 取并集
  P2: [pcA1, pcA2],
  P3: [pcA1, pcA2, pcA3],
  P4: [pcA1, pcA2],
  P5: [pcA1]
}
```

---

## 3. pcAction 合并规则

### 3.1 合并原则

- 相同 `permissionId` 的 `pcAction` 取并集
- 不同 `permissionId` 的 `pcAction` 不合并
- `pcAction` 的合并基于 `permCode` 去重

### 3.2 合并算法

```typescript
function mergePermissions(rolePermissions: RolePermission[]): UserPermission[] {
  const permissionMap = new Map<string, Set<string>>();

  for (const rolePerm of rolePermissions) {
    const { permissionId, pcAction } = rolePerm;

    if (!permissionMap.has(permissionId)) {
      permissionMap.set(permissionId, new Set());
    }

    // 合并 pcAction 的 permCode
    if (pcAction) {
      for (const action of pcAction) {
        permissionMap.get(permissionId)!.add(action.permCode);
      }
    }
  }

  // 转换为最终结果
  return Array.from(permissionMap.entries()).map(([permissionId, permCodes]) => ({
    permissionId,
    pcAction: Array.from(permCodes).map(code => ({ permCode: code }))
  }));
}
```

### 3.3 示例

```
输入（角色权限）：
RolePermission 1: { permissionId: 'P1', pcAction: [{name: '新增', permCode: 'add'}, {name: '编辑', permCode: 'edit'}] }
RolePermission 2: { permissionId: 'P1', pcAction: [{name: '编辑', permCode: 'edit'}, {name: '删除', permCode: 'delete'}] }
RolePermission 3: { permissionId: 'P2', pcAction: [{name: '查看', permCode: 'view'}] }

输出（用户最终权限）：
UserPermission 1: { permissionId: 'P1', pcAction: [{permCode: 'add'}, {permCode: 'edit'}, {permCode: 'delete'}] }
UserPermission 2: { permissionId: 'P2', pcAction: [{permCode: 'view'}] }
```

---

## 4. 权限验证流程

### 4.1 运行时权限验证

```mermaid
sequenceDiagram
    participant U as 用户请求
    participant M as 权限中间件
    participant C as 缓存服务
    participant S as 权限服务
    participant D as 数据库

    U->>M: 请求资源
    M->>C: 查询用户权限缓存
    C-->>M: 返回缓存权限

    alt 缓存未命中
        M->>S: 计算用户权限
        S->>D: 查询用户角色关联
        D-->>S: 返回角色列表
        S->>D: 查询角色权限
        D-->>S: 返回角色权限
        S->>S: 计算并集
        S->>C: 更新缓存
        C-->>M: 返回权限
    end

    M->>M: 验证权限
    M-->>U: 允许/拒绝请求
```

### 4.2 验证规则

| 验证项 | 说明 |
|--------|------|
| permissionId | 检查用户是否拥有所请求的权限 ID |
| pcAction | 检查用户是否拥有所请求的操作权限 |
| 权限池 | 检查权限是否在应用类型权限池中（可选） |

---

## 5. 业务规则

### 5.1 权限隔离

- 不同应用实例的权限相互隔离
- 用户在不同应用实例下可能拥有不同的权限
- 用户切换应用实例后，权限自动刷新

### 5.2 拥有者权限

- 拥有者通过绑定拥有者角色获得权限
- 拥有者角色 (`isOwner=1`) 的权限由应用类型权限池分配
- 拥有者变更时，自动调整拥有者角色绑定

### 5.3 多角色权限

- 一个用户可以绑定多个角色
- 多角色的权限取并集
- 相同 `permissionId` 的 `pcAction` 合并

### 5.4 缓存策略

- 用户权限计算结果应该缓存，避免重复计算
- 缓存键：`user:{userId}:app:{appId}:permissions`
- 缓存过期条件：
  - 用户角色变更
  - 角色权限变更
  - 用户切换应用实例
  - 缓存过期时间到达（建议 30 分钟）

---

## 相关文档

- [数据库实体设计](../database/entities-design.md)
- [权限池配置流程](./permission-pool-setup.md)
- [权限分配流程](./permission-assignment.md)
- [用户登录流程](./user-login-flow.md)

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-25 | 初始版本，描述权限计算的详细规则 |

---

*本文档由基础设施页面详细设计文档拆分而来*

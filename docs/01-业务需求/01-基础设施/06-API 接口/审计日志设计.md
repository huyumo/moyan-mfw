# 审计日志系统设计

> 版本：1.0.0
> 最后更新：2026-03-27

---

## 概述

审计日志系统用于记录和追踪系统中的所有关键操作，包括用户登录、权限变更、角色变更、应用配置变更等。审计日志为系统安全、责任追溯和合规性提供数据支持。

---

## 审计日志表结构

### sys_audit_log 表

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | BIGINT | 是 | 主键 ID，自增 |
| trace_id | VARCHAR(64) | 是 | 请求追踪 ID，用于链路追踪 |
| operator_id | BIGINT | 是 | 操作人用户 ID |
| operator_name | VARCHAR(50) | 是 | 操作人姓名（冗余存储，便于查询） |
| operator_phone | VARCHAR(20) | 否 | 操作人手机号（冗余存储） |
| operation_type | VARCHAR(50) | 是 | 操作类型编码（见操作类型定义） |
| operation_module | VARCHAR(50) | 是 | 操作所属模块（AUTH/USER/ROLE/APP/PERMISSION 等） |
| operation_desc | VARCHAR(500) | 是 | 操作描述 |
| request_method | VARCHAR(10) | 是 | 请求方法（GET/POST/PUT/DELETE） |
| request_url | VARCHAR(500) | 是 | 请求 URL |
| request_params | TEXT | 否 | 请求参数（JSON 格式） |
| response_code | INT | 是 | 响应状态码（0 表示成功） |
| response_message | VARCHAR(500) | 否 | 响应消息 |
| ip_address | VARCHAR(50) | 是 | 操作 IP 地址 |
| user_agent | VARCHAR(500) | 否 | 客户端标识 |
| app_id | BIGINT | 否 | 关联应用 ID（操作所属应用） |
| app_code | VARCHAR(50) | 否 | 关联应用编码（冗余存储） |
| target_id | VARCHAR(100) | 否 | 操作目标 ID（被操作资源的 ID） |
| target_name | VARCHAR(200) | 否 | 操作目标名称（被操作资源的名称） |
| before_data | TEXT | 否 | 操作前数据快照（JSON 格式，用于变更对比） |
| after_data | TEXT | 否 | 操作后数据快照（JSON 格式，用于变更对比） |
| status | TINYINT | 是 | 操作结果：0=失败，1=成功 |
| error_message | VARCHAR(1000) | 否 | 失败时的错误信息 |
| cost_time | INT | 否 | 接口耗时（毫秒） |
| create_time | DATETIME | 是 | 操作时间 |

### 索引设计

| 索引名 | 字段 | 类型 | 说明 |
|--------|------|------|------|
| idx_operator_id | operator_id | 普通索引 | 按操作人查询 |
| idx_operation_type | operation_type | 普通索引 | 按操作类型查询 |
| idx_operation_module | operation_module | 普通索引 | 按模块查询 |
| idx_create_time | create_time | 普通索引 | 按时间范围查询 |
| idx_trace_id | trace_id | 唯一索引 | 链路追踪 |
| idx_app_id | app_id | 普通索引 | 按应用查询 |
| idx_target_id | target_id | 普通索引 | 按目标资源查询 |

### 建表 SQL 示例

```sql
CREATE TABLE `sys_audit_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
  `trace_id` VARCHAR(64) NOT NULL COMMENT '请求追踪 ID',
  `operator_id` BIGINT NOT NULL COMMENT '操作人用户 ID',
  `operator_name` VARCHAR(50) NOT NULL COMMENT '操作人姓名',
  `operator_phone` VARCHAR(20) DEFAULT NULL COMMENT '操作人手机号',
  `operation_type` VARCHAR(50) NOT NULL COMMENT '操作类型编码',
  `operation_module` VARCHAR(50) NOT NULL COMMENT '操作模块',
  `operation_desc` VARCHAR(500) NOT NULL COMMENT '操作描述',
  `request_method` VARCHAR(10) NOT NULL COMMENT '请求方法',
  `request_url` VARCHAR(500) NOT NULL COMMENT '请求 URL',
  `request_params` TEXT COMMENT '请求参数 JSON',
  `response_code` INT NOT NULL COMMENT '响应状态码',
  `response_message` VARCHAR(500) DEFAULT NULL COMMENT '响应消息',
  `ip_address` VARCHAR(50) NOT NULL COMMENT '操作 IP 地址',
  `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '客户端标识',
  `app_id` BIGINT DEFAULT NULL COMMENT '关联应用 ID',
  `app_code` VARCHAR(50) DEFAULT NULL COMMENT '关联应用编码',
  `target_id` VARCHAR(100) DEFAULT NULL COMMENT '操作目标 ID',
  `target_name` VARCHAR(200) DEFAULT NULL COMMENT '操作目标名称',
  `before_data` TEXT COMMENT '操作前数据快照 JSON',
  `after_data` TEXT COMMENT '操作后数据快照 JSON',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '操作结果：0=失败，1=成功',
  `error_message` VARCHAR(1000) DEFAULT NULL COMMENT '错误信息',
  `cost_time` INT DEFAULT NULL COMMENT '接口耗时 (ms)',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_trace_id` (`trace_id`),
  KEY `idx_operator_id` (`operator_id`),
  KEY `idx_operation_type` (`operation_type`),
  KEY `idx_operation_module` (`operation_module`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_app_id` (`app_id`),
  KEY `idx_target_id` (`target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审计日志表';
```

---

## 审计事件类型定义

### 认证模块 (AUTH)

| 事件编码 | 事件名称 | 触发时机 | 记录内容 |
|----------|----------|----------|----------|
| AUTH_LOGIN | 用户登录 | 用户登录成功/失败 | 登录账号、IP 地址、登录结果 |
| AUTH_LOGOUT | 用户登出 | 用户主动登出 | 登出账号、IP 地址 |
| AUTH_TOKEN_REFRESH | Token 刷新 | 刷新 Token | 用户 ID、新旧 Token 信息 |
| AUTH_PASSWORD_CHANGE | 密码修改 | 用户修改密码 | 用户 ID、修改结果 |
| AUTH_PASSWORD_RESET | 密码重置 | 管理员重置密码 | 操作人、目标用户、新密码 |

### 用户模块 (USER)

| 事件编码 | 事件名称 | 触发时机 | 记录内容 |
|----------|----------|----------|----------|
| USER_CREATE | 创建用户 | 新增用户账号 | 新用户信息 |
| USER_UPDATE | 更新用户 | 修改用户信息 | 变更前后的用户数据 |
| USER_DELETE | 删除用户 | 删除用户账号 | 被删除用户 ID、姓名 |
| USER_ENABLE | 启用用户 | 启用被禁用的账号 | 用户 ID、操作人 |
| USER_DISABLE | 禁用用户 | 禁用用户账号 | 用户 ID、禁用原因 |

### 角色模块 (ROLE)

| 事件编码 | 事件名称 | 触发时机 | 记录内容 |
|----------|----------|----------|----------|
| ROLE_CREATE | 创建角色 | 新增角色 | 角色信息、权限列表 |
| ROLE_UPDATE | 更新角色 | 修改角色信息或权限 | 变更前后的角色数据 |
| ROLE_DELETE | 删除角色 | 删除角色 | 被删除角色 ID、名称 |
| ROLE_ASSIGN | 分配角色 | 给用户分配角色 | 用户 ID、角色 ID 列表 |
| ROLE_REVOKE | 撤销角色 | 移除用户角色 | 用户 ID、被移除的角色 ID |

### 权限模块 (PERMISSION)

| 事件编码 | 事件名称 | 触发时机 | 记录内容 |
|----------|----------|----------|----------|
| PERM_CREATE | 创建权限 | 新增权限节点 | 权限信息（name、permCode、type） |
| PERM_UPDATE | 更新权限 | 修改权限信息 | 变更前后的权限数据 |
| PERM_DELETE | 删除权限 | 删除权限节点 | 被删除权限 ID、编码 |
| POOL_CONFIG | 配置权限池 | 设置应用类型权限池 | 应用类型 ID、权限列表 |

### 应用模块 (APP)

| 事件编码 | 事件名称 | 触发时机 | 记录内容 |
|----------|----------|----------|----------|
| APP_CREATE | 创建应用 | 新增应用实例 | 应用信息、拥有者 |
| APP_UPDATE | 更新应用 | 修改应用信息 | 变更前后的应用数据 |
| APP_DELETE | 删除应用 | 删除应用实例 | 被删除应用 ID、名称 |
| APP_OWNER_CHANGE | 变更拥有者 | 应用拥有者变更 | 应用 ID、原拥有者、新拥有者 |

### 应用类型模块 (APP_TYPE)

| 事件编码 | 事件名称 | 触发时机 | 记录内容 |
|----------|----------|----------|----------|
| APP_TYPE_CREATE | 创建应用类型 | 新增应用类型 | 应用类型信息 |
| APP_TYPE_UPDATE | 更新应用类型 | 修改应用类型 | 变更前后的应用类型数据 |
| APP_TYPE_DELETE | 删除应用类型 | 删除应用类型 | 被删除应用类型 ID、名称 |

### 成员模块 (MEMBER)

| 事件编码 | 事件名称 | 触发时机 | 记录内容 |
|----------|----------|----------|----------|
| MEMBER_ADD | 添加成员 | 添加用户到应用成员 | 应用 ID、成员 ID、角色 |
| MEMBER_REMOVE | 移除成员 | 从应用移除成员 | 应用 ID、被移除成员 ID |
| MEMBER_ROLE_UPDATE | 更新成员角色 | 修改成员角色 | 成员 ID、原角色、新角色 |

### 系统模块 (SYSTEM)

| 事件编码 | 事件名称 | 触发时机 | 记录内容 |
|----------|----------|----------|----------|
| SYS_CONFIG_UPDATE | 更新系统配置 | 修改系统参数 | 配置项、原值、新值 |
| SYS_DICTIONARY_UPDATE | 更新数据字典 | 修改字典数据 | 字典类型、变更内容 |

---

## 存储策略

### 数据分区

为提升查询性能和管理效率，审计日志表采用按时间分区策略：

```sql
-- 按月分区示例
ALTER TABLE sys_audit_log
PARTITION BY RANGE (YEAR(create_time) * 100 + MONTH(create_time)) (
    PARTITION p202601 VALUES LESS THAN (202602),
    PARTITION p202602 VALUES LESS THAN (202603),
    PARTITION p202603 VALUES LESS THAN (202604),
    PARTITION p202604 VALUES LESS THAN (202605),
    PARTITION p202605 VALUES LESS THAN (202606),
    PARTITION p202606 VALUES LESS THAN (202607),
    PARTITION p202607 VALUES LESS THAN (202608),
    PARTITION p202608 VALUES LESS THAN (202609),
    PARTITION p202609 VALUES LESS THAN (202610),
    PARTITION p202610 VALUES LESS THAN (202611),
    PARTITION p202611 VALUES LESS THAN (202612),
    PARTITION p202612 VALUES LESS THAN (202701)
);
```

### 数据保留策略

| 日志类型 | 保留期限 | 处理方式 |
|----------|----------|----------|
| 认证日志 (AUTH_*) | 180 天 | 自动清理 |
| 权限变更日志 (ROLE_*, PERM_*, POOL_*) | 永久 | 归档存储 |
| 应用配置日志 (APP_*, APP_TYPE_*) | 365 天 | 到期归档 |
| 用户操作日志 (USER_*, MEMBER_*) | 365 天 | 到期清理 |
| 系统配置日志 (SYS_*) | 永久 | 归档存储 |

### 归档策略

1. **冷数据归档**：超过保留期限但需要保留的日志，迁移至 `sys_audit_log_archive` 表
2. **归档表结构**：与主表相同，仅索引优化为按时间查询
3. **归档周期**：每月执行一次归档任务

---

## 审计日志查询 API

### 查询审计日志列表

**接口**: `GET /api/v1/audit-logs`

**权限**: 需要 `audit:log:view` 权限

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 20，最大 100 |
| operatorId | bigint | 否 | 按操作人 ID 筛选 |
| operatorName | string | 否 | 按操作人姓名模糊查询 |
| operationType | string | 否 | 按操作类型筛选 |
| operationModule | string | 否 | 按模块筛选 |
| appId | bigint | 否 | 按应用 ID 筛选 |
| targetId | string | 否 | 按目标资源 ID 筛选 |
| status | number | 否 | 按操作结果筛选：0=失败，1=成功 |
| startTime | string | 否 | 开始时间 (ISO 8601) |
| endTime | string | 否 | 结束时间 (ISO 8601) |
| traceId | string | 否 | 按追踪 ID 查询 |

**响应示例**:

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1001,
        "traceId": "trace-20260327-001",
        "operatorId": 1,
        "operatorName": "张三",
        "operationType": "APP_OWNER_CHANGE",
        "operationModule": "APP",
        "operationDesc": "变更应用拥有者",
        "requestMethod": "PUT",
        "requestUrl": "/api/v1/apps/app-001/owner",
        "responseCode": 0,
        "responseMessage": "成功",
        "ipAddress": "192.168.1.100",
        "appId": 10,
        "appCode": "app-mall",
        "targetId": "app-001",
        "targetName": "商城应用",
        "beforeData": "{\"ownerId\": 1, \"ownerName\": \"张三\"}",
        "afterData": "{\"ownerId\": 2, \"ownerName\": \"李四\"}",
        "status": 1,
        "costTime": 120,
        "createTime": "2026-03-27T10:30:00Z"
      }
    ],
    "total": 156,
    "page": 1,
    "pageSize": 20
  },
  "message": "success"
}
```

### 查询审计日志详情

**接口**: `GET /api/v1/audit-logs/:id`

**权限**: 需要 `audit:log:view` 权限

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | bigint | 审计日志 ID |

**响应示例**:

```json
{
  "code": 0,
  "data": {
    "id": 1001,
    "traceId": "trace-20260327-001",
    "operatorId": 1,
    "operatorName": "张三",
    "operatorPhone": "13800138000",
    "operationType": "APP_OWNER_CHANGE",
    "operationModule": "APP",
    "operationDesc": "变更应用拥有者：原拥有者'张三' -> 新拥有者'李四'",
    "requestMethod": "PUT",
    "requestUrl": "/api/v1/apps/app-001/owner",
    "requestParams": "{\"newOwnerId\": 2}",
    "responseCode": 0,
    "responseMessage": "成功",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "appId": 10,
    "appCode": "app-mall",
    "targetId": "app-001",
    "targetName": "商城应用",
    "beforeData": {
      "ownerId": 1,
      "ownerName": "张三",
      "updateTime": "2026-03-01T08:00:00Z"
    },
    "afterData": {
      "ownerId": 2,
      "ownerName": "李四",
      "updateTime": "2026-03-27T10:30:00Z"
    },
    "status": 1,
    "errorMessage": null,
    "costTime": 120,
    "createTime": "2026-03-27T10:30:00Z"
  },
  "message": "success"
}
```

### 导出审计日志

**接口**: `POST /api/v1/audit-logs/export`

**权限**: 需要 `audit:log:export` 权限

**请求参数**: 与查询列表参数相同

**响应**: 返回导出任务 ID，异步生成后通过消息通知

```json
{
  "code": 0,
  "data": {
    "taskId": "export-20260327-001",
    "status": "processing",
    "estimatedTime": 30
  },
  "message": "导出任务已创建"
}
```

---

## 审计日志记录规范

### 日志记录时机

1. **写入时机**：所有审计日志在业务操作完成后异步写入
2. **事务边界**：审计日志记录不在业务事务内，避免影响主流程性能
3. **失败处理**：审计日志记录失败不影响主业务流程

### 敏感数据脱敏

以下字段在存储前需进行脱敏处理：

| 字段 | 脱敏规则 |
|------|----------|
| operator_phone | 保留前 3 位和后 4 位，中间用 * 替代 |
| request_params 中的密码字段 | 统一替换为 `******` |
| after_data 中的敏感字段 | 根据业务规则脱敏 |

### 数据快照规范

对于变更类操作，需记录变更前后的数据快照：

```json
{
  "beforeData": {
    // 关键字段，用于对比
    "field1": "原值",
    "field2": "原值"
  },
  "afterData": {
    // 关键字段，用于对比
    "field1": "新值",
    "field2": "新值"
  }
}
```

**需要记录快照的操作**:
- 用户信息变更
- 角色权限变更
- 应用配置变更
- 拥有者变更
- 系统配置变更

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-27 | 初始版本 |

---

*本文档定义审计日志系统的完整设计，包括表结构、事件类型、存储策略和 API 设计*

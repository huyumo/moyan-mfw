# 权限管理页面文档

## 概述

本文档描述权限管理页面的前端流程和核心业务，包含 PC 权限树和 OpenAPI 权限管理。

**模块路径**: `packages/base-frontend/src/app/pages/permission/`

**版本**: 2.0.0

---

## 目录

1. [PC 权限树管理](#1-pc-权限树管理)
2. [OpenAPI 权限管理](#2-openapi-权限管理)
3. [API 接口](#API 接口)
4. [业务规则](#业务规则)

---

## 1. PC 权限树管理

### 页面流程图

```mermaid
flowchart TD
    Start([进入 PC 权限树页面]) --> LoadTree[调用 getTree API]
    LoadTree --> RenderTree[渲染权限树表格]

    RenderTree --> Search[输入关键词过滤]
    Search --> FilterTree[过滤树节点]
    FilterTree --> RenderFiltered[渲染过滤结果]

    RenderFiltered --> Action{选择操作}
    Action -->|新建根节点 | CreateRoot[新建根节点<br/>NodeType=MENU]
    Action -->|新建子节点 | CreateChild[新建子节点]
    Action -->|编辑 | EditNode[编辑节点]
    Action -->|删除 | DeleteNode[删除节点]

    CreateRoot --> OpenDrawer[打开抽屉]
    CreateChild --> OpenDrawer
    EditNode --> OpenDrawer

    OpenDrawer --> FillForm[填写表单]
    FillForm --> SelectType[选择权限类型和节点类型]
    SelectType --> Menu{NodeType=MENU}
    SelectType --> Page{NodeType=PAGE}

    Menu --> ParentCheck{是否有父节点？}
    Page --> ParentCheck

    ParentCheck -->|是 | ValidateParent[验证父节点类型<br/>必须是 MENU]
    ValidateParent -->|合法 | SaveNode[保存节点]
    ValidateParent -->|非法 | ShowParentError[显示父节点类型错误]

    ParentCheck -->|否 | RootCheck{是否为根节点？}
    RootCheck -->|是 | SaveNode
    RootCheck -->|否 | ShowError[显示错误]

    SaveNode --> IsEdit{是否编辑？}
    IsEdit -->|是 | UpdateAPI[调用 updateByCode API]
    IsEdit -->|否 | CreateAPI[调用 create API]

    UpdateAPI --> RefreshTree[刷新树]
    CreateAPI --> RefreshTree

    DeleteNode --> Confirm{确认删除？}
    Confirm -->|是 | DeleteAPI[调用 deleteByCode API]
    Confirm -->|否 | Cancel1[取消]
    DeleteAPI --> RefreshTree
```

### 功能说明

| 功能 | 说明 |
|------|------|
| 树形展示 | 以树形结构展示 PC 权限，支持展开/折叠 |
| 关键词过滤 | 输入关键词过滤树节点 |
| 新建根节点 | 创建根节点权限（NodeType=MENU） |
| 新建子节点 | 在选中节点下创建子节点（MENU 或 PAGE） |
| 编辑节点 | 修改权限节点信息 |
| 编辑 pcAction | 编辑 PAGE 节点的操作权限列表 |
| 删除节点 | 删除权限节点及其子节点 |

### 权限类型 hierarchy

```
ROOT (MENU)
└── 一级菜单 (MENU)
    ├── 二级菜单 (MENU)
    │   └── 页面 (PAGE)
    │       └── pcAction: [{name: '新增', permCode: 'xxx:add'}, ...]
    └── 页面 (PAGE)
        └── pcAction: [{name: '编辑', permCode: 'xxx:edit'}, ...]
```

### 业务规则

- `NodeType.PAGE` 的 `parentId` 必须指向 `NodeType.MENU` 类型
- 根节点只能创建 `NodeType.MENU` 类型
- `pcAction` 字段仅存储在 `NodeType.PAGE` 节点上
- `pcAction` 表示该页面下的所有操作权限（按钮）列表
- 删除节点时级联删除所有子节点

---

## 2. OpenAPI 权限管理

### 页面流程图

```mermaid
flowchart TD
    Start([进入 OpenAPI 权限页面]) --> SyncCheck{是否需要同步？}

    SyncCheck -->|是 | SyncAPI[调用 syncOpenApiNodes API]
    SyncCheck -->|否 | LoadTree[调用 getTree API]

    SyncAPI --> ScanCode[扫描代码元数据]
    ScanCode --> ExtractAPI[提取 API 定义]
    ExtractAPI --> CompareDB[对比数据库记录]
    CompareDB --> UpdateRecords[更新/创建/删除记录]
    UpdateRecords --> LoadTree

    LoadTree --> RenderTree[渲染 API 权限树]
    RenderTree --> ViewDetail[查看 API 详情]

    ViewDetail --> DetailDrawer[打开详情抽屉]
    DetailDrawer --> ShowMethodInfo[显示方法信息]
    DetailDrawer --> ShowParamFields[显示参数字段]
    DetailDrawer --> ShowResultFields[显示响应字段]

    ShowParamFields --> ParamTable[参数表格]
    ShowResultFields --> ResultTable[响应表格]

    ParamTable --> FieldInfo[字段名/类型/必填/描述]
    ResultTable --> FieldInfo
```

### 功能说明

| 功能 | 说明 |
|------|------|
| 同步 API | 扫描代码元数据，自动同步 API 权限到数据库 |
| 树形展示 | 以树形结构展示 API 权限（Module -> Controller -> Method） |
| 查看详情 | 查看 API 详细信息，包括参数和响应字段 |
| 字段管理 | 查看参数字段和响应字段的类型、描述等 |

### API 权限树结构

```
API:ROOT (API)
└── API:MODULE:SYS (API)
    ├── API:CONTROLLER:USER (API)
    │   ├── API:METHOD:getList
    │   ├── API:METHOD:getById
    │   └── API:METHOD:create
    └── API:CONTROLLER:ROLE (API)
        └── API:METHOD:assignPermissions
```

### 业务规则

- API 权限通过 `syncOpenApiNodes()` 自动同步代码元数据
- 同步操作会对比数据库记录，执行更新/创建/删除操作
- API 权限的参数和响应字段由代码元数据自动生成

---

## API 接口

### 获取权限树

```
GET /sys/permission/tree
Params: { permissionType?: string }
```

### 创建权限

```
POST /sys/permission
Body: {
  permName: string,
  permCode: string,
  permDesc?: string,
  permissionType: PermissionType,
  nodeType: NodeType,
  parentId?: string,
  routePath?: string,
  componentPath?: string,
  iconName?: string,
  sortOrder?: number,
  isVisible?: number,
  isCache?: number,
  showMode?: ShowMode,
  pcAction?: Array<{name: string, permCode: string}>  // 仅 PAGE 节点
}
```

### 更新权限

```
PUT /sys/permission/:code
Body: {
  permName?: string,
  permDesc?: string,
  routePath?: string,
  componentPath?: string,
  iconName?: string,
  sortOrder?: number,
  isVisible?: number,
  isCache?: number,
  showMode?: ShowMode,
  pcAction?: Array<{name: string, permCode: string}>  // 仅 PAGE 节点
}
```

### 删除权限

```
DELETE /sys/permission/:code
```

### 同步 OpenAPI 权限

```
POST /sys/permission/sync-open-api
```

### 获取权限详情

```
GET /sys/permission/:code
```

---

## 业务规则

### 权限类型枚举

```typescript
enum PermissionType {
  PC = 'PC',                     // PC 权限
  NORMAL = 'NORMAL',             // 普通权限
  API = 'API',                   // OpenAPI 权限
}

enum NodeType {
  MENU = 'MENU',            // 目录（用于 PC 权限的目录节点）
  PAGE = 'PAGE',            // 页面（PermissionType=PC 时使用）
  TAG = 'TAG',              // 标签（PermissionType=NORMAL 时使用）
  API = 'API',              // API（PermissionType=API 时使用）
}

enum ShowMode {
  NORMAL = 'NORMAL',             // 普通模式
  DEV = 'DEV',                   // 开发模式
}
```

### 权限编码

- `permCode` 全局唯一，创建后不可修改
- 建议编码格式：
  - MENU: `menu.{module}.{name}`
  - PAGE: `page.{module}.{name}`
  - TAG: `tag.{module}.{name}`
  - API: `api:{module}:{controller}:{method}`

### 显示模式

- `showMode = NORMAL`: 普通模式，对所有用户可见
- `showMode = DEV`: 开发模式，仅对开发模式用户可见

### pcAction 管理

- `pcAction` 仅在 `PermissionType=PC` 且 `NodeType=PAGE` 的节点上有效
- `pcAction` 格式：`[{name: string, permCode: string}]`
- `pcAction` 的 `permCode` 必须全局唯一

---

## 相关文档

- [数据库实体设计](./database-entities-design.md)
- [应用类型管理页面](./app-type-management.md)
- [角色管理页面](./role-management.md)
- [权限池配置流程](./permission-pool-setup.md)

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 2.0.0 | 2026-03-24 | 重构：使用新的 PermissionType 和 NodeType，添加 pcAction 管理 |
| 1.0.0 | 2026-03-23 | 初始版本，从基础设施详细设计文档拆分 |

---

*本文档由基础设施页面详细设计文档拆分而来*

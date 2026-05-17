# Manifest 规范（extension.json）

> `extension.json` 是扩展包的**清单文件**，声明扩展的元数据、权限节点、依赖关系等。框架在启动时会严格校验该文件。

---

## 目录

- [JSON Schema 定义](#json-schema-定义)
- [字段详细说明](#字段详细说明)
- [类型约束](#类型约束)
- [与 ExtensionManifest 接口对照表](#与-extensionmanifest-接口对照表)
- [完整示例](#完整示例)
- [校验规则](#校验规则)

---

## JSON Schema 定义

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "extension-manifest.json",
  "title": "ExtensionManifest",
  "description": "MFW 扩展包清单文件定义",
  "type": "object",
  "required": ["name", "version", "displayName", "description", "routePrefix", "permCodeNodes"],
  "additionalProperties": false,
  "properties": {
    "name": {
      "type": "string",
      "description": "扩展包标识名",
      "pattern": "^moyan-mfw-extension-[a-z0-9-]+$"
    },
    "version": {
      "type": "string",
      "description": "语义化版本号",
      "pattern": "^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9.]+)?$"
    },
    "displayName": {
      "type": "string",
      "description": "显示名称（中文）",
      "minLength": 1,
      "maxLength": 50
    },
    "description": {
      "type": "string",
      "description": "功能描述",
      "minLength": 1,
      "maxLength": 500
    },
    "routePrefix": {
      "type": "string",
      "description": "API 路由前缀（必须 /ext/ 开头）",
      "pattern": "^\\/ext\\/[a-z][a-z0-9-]*$"
    },
    "permCodePrefix": {
      "type": "string",
      "description": "权限编码前缀（可选，默认从 routePrefix 提取）",
      "pattern": "^[a-z]+:[a-z]+$"
    },
    "namespaceName": {
      "type": "string",
      "description": "命名空间显示名称",
      "minLength": 1,
      "maxLength": 50
    },
    "permCodeNodes": {
      "type": "array",
      "description": "权限节点列表",
      "items": {
        "$ref": "#/definitions/PermCodeNode"
      }
    },
    "provides": {
      "type": "object",
      "description": "声明提供的服务、字典、实体等",
      "additionalProperties": true
    },
    "requiredExtensions": {
      "type": "array",
      "description": "必须依赖的其他扩展",
      "items": { "type": "string" }
    },
    "optionalExtensions": {
      "type": "array",
      "description": "可选依赖的其他扩展",
      "items": { "type": "string" }
    },
    "appTypes": {
      "type": "array",
      "description": "适用应用类型（* 表示全部）",
      "items": { "type": "string" }
    },
    "minFrameworkVersion": {
      "type": "string",
      "description": "最低框架版本要求",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    }
  },
  "definitions": {
    "PermCodeNode": {
      "type": "object",
      "required": ["permCode", "permName", "nodeType", "group"],
      "additionalProperties": false,
      "properties": {
        "permCode": {
          "type": "string",
          "description": "权限编码",
          "pattern": "^[a-z]+:[a-z-]+:[a-z]+$"
        },
        "permName": {
          "type": "string",
          "description": "权限名称（中文）",
          "minLength": 1
        },
        "nodeType": {
          "type": "string",
          "enum": ["TAG"],
          "description": "节点类型（固定为 TAG）"
        },
        "group": {
          "type": "string",
          "description": "所属权限组",
          "minLength": 1
        }
      }
    }
  }
}
```

---

## 字段详细说明

### 必填字段

#### name

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 格式 | `moyan-mfw-extension-{name}` |
| 示例 | `"moyan-mfw-extension-ad"` |

**命名规范**：

- 前缀固定为 `moyan-mfw-extension-`
- `{name}` 使用小写字母、数字、连字符
- 长度建议 3-20 个字符
- 应与 npm 包名一致

#### version

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 格式 | SemVer（`MAJOR.MINOR.PATCH[-prerelease]`） |
| 示例 | `"0.1.0"`、`"1.2.3-beta.1"` |

**版本策略**：

- `0.x.x`：开发阶段，不保证 API 稳定性
- `1.x.x`：稳定版，遵循语义化版本控制
- **破坏性变更必须升级 MAJOR 版本**

#### displayName

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 长度 | 1-50 字符 |
| 示例 | `"广告管理"`、`"用户中心"` |

用于管理后台展示和日志输出。

#### description

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 长度 | 1-500 字符 |
| 示例 | `"提供广告位管理功能，支持在广告位详情中管理广告内容"` |

应清晰描述扩展的核心功能和适用场景。

#### routePrefix

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 格式 | `/ext/{namespace}` |
| 示例 | `"/ext/ad"`、`"/ext/user-center"` |

**关键约束**：

1. **必须以 `/ext/` 开头**
2. `{namespace}` 使用小写字母、数字、连字符
3. 该值同时决定：
   - 后端 API 路由前缀
   - 前端路由前缀
   - 权限编码的命名空间

#### permCodeNodes

| 属性 | 值 |
|------|-----|
| 类型 | `Array<PermCodeNode>` |
| 最小长度 | 1 |

声明扩展需要的所有权限节点。每个节点包含：

**PermCodeNode 子字段**：

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `permCode` | `string` | 权限编码 | `"ad:placement:view"` |
| `permName` | `string` | 权限名称 | `"查看广告位"` |
| `nodeType` | `"TAG"` | 节点类型 | 固定值 |
| `group` | `string` | 权限组 | `"广告管理"` |

### 可选字段

#### permCodePrefix

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 默认值 | 从 `routePrefix` 自动提取 |
| 示例 | `"ext:ad"` |

显式指定权限编码前缀。通常不需要设置，框架会自动从 `routePrefix` 提取。

#### namespaceName

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 默认值 | 与 `displayName` 相同 |
| 示例 | `"广告管理"` |

命名空间的显示名称，用于权限管理界面。

#### provides

| 属性 | 值 |
|------|-----|
| 类型 | `Record<string, unknown>` |
| 示例 | `{ dicts: ['ad_link_type'], entities: ['ext_ad_contents'] }` |

声明扩展对外提供的能力：

```typescript
provides: {
  dicts: ['ad_link_type'],           // 提供的字典
  entities: ['ext_ad_contents'],     // 提供的数据库实体
  services: ['AdService'],           // 提供的服务（可被其他扩展注入）
}
```

#### requiredExtensions / optionalExtensions

| 属性 | 值 |
|------|-----|
| 类型 | `string[]` |
| 示例 | `["moyan-mfw-extension-user"]` |

声明扩展间依赖关系：

- `requiredExtensions`：缺少时扩展无法启动
- `optionalExtensions`：缺失时可降级运行

#### appTypes

| 属性 | 值 |
|------|-----|
| 类型 | `string[]` |
| 示例 | `["admin", "portal"]` 或 `["*"]` |

限制扩展适用的应用类型。使用 `["*"]` 表示适用于所有类型。

#### minFrameworkVersion

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 格式 | SemVer |
| 示例 | `"1.0.0"` |

声明依赖的最低 MFW 框架版本。框架启动时会校验当前版本是否满足要求。

---

## 类型约束

### routePrefix 正则约束

```
^\/ext\/[a-z][a-z0-9-]*$
```

**合法示例**：

- ✅ `/ext/ad`
- ✅ `/ext/user-center`
- ✅ `/ext/order-management`

**非法示例**：

- ❌ `/api/ad` （不以 `/ext/` 开头）
- ❌ `/ext/AD` （包含大写字母）
- ❌ `/ext/ad/` （尾部斜杠）
- ❌ `/ext/_ad` （以下划线开头）

### permCode 正则约束

```
^[a-z]+:[a-z-]+:[a-z]$
```

**结构**：`{namespace}:{resource}:{action}`

**合法示例**：

- ✅ `ad:placement:view`
- ✅ `ad:content:create`
- ✅ `user:profile:update`

**非法示例**：

- ❌ `ad:Placement:View` （大写）
- ❌ `ad:placement` （缺少 action）
- ❌ `ad_placement_view` （冒号分隔）

### name 正则约束

```
^moyan-mfw-extension-[a-z0-9-]+$
```

---

## 与 ExtensionManifest 接口对照表

| JSON 字段 | TypeScript 接口字段 | 类型 | 必填 | 默认值 |
|-----------|-------------------|------|------|--------|
| `name` | `name` | `string` | ✅ | - |
| `version` | `version` | `string` | ✅ | - |
| `displayName` | `displayName` | `string` | ✅ | - |
| `description` | `description` | `string` | ✅ | - |
| `routePrefix` | `routePrefix` | `string` | ✅ | - |
| `permCodePrefix` | *(无对应字段)* | - | ❌ | 从 routePrefix 提取 |
| `namespaceName` | *(无对应字段)* | - | ❌ | 同 displayName |
| `permCodeNodes` | `permCodeNodes` | `Array<PermCodeNode>` | ✅ | - |
| `provides` | `provides` | `Record<string, unknown>` | ❌ | `undefined` |
| `requiredExtensions` | `requiredExtensions` | `string[]` | ✅ | `[]` |
| `optionalExtensions` | `optionalExtensions` | `string[]` | ✅ | `[]` |
| `appTypes` | `appTypes` | `string[]` | ✅ | `['*']` |
| `minFrameworkVersion` | `minFrameworkVersion` | `string` | ✅ | `'1.0.0'` |

**TypeScript 接口定义**（来自 [create-extension-backend-app.ts](../../../packages/base/src/backend/src/create-extension-backend-app.ts)）：

```typescript
export interface ExtensionManifest {
  name: string
  version: string
  displayName: string
  description: string
  routePrefix: string
  permCodeNodes: Array<{
    permCode: string
    permName: string
    nodeType: string
    group: string
  }>
  requiredExtensions: string[]
  optionalExtensions: string[]
  appTypes: string[]
  minFrameworkVersion: string
  provides?: Record<string, unknown>
}
```

---

## 完整示例

### 最小配置

```json
{
  "name": "moyan-mfw-extension-demo",
  "version": "0.1.0",
  "displayName": "演示扩展",
  "description": "一个最小化的扩展示例",
  "routePrefix": "/ext/demo",
  "permCodeNodes": [
    { "permCode": "demo:item:view", "permName": "查看项目", "nodeType": "TAG", "group": "演示" },
    { "permCode": "demo:item:create", "permName": "创建项目", "nodeType": "TAG", "group": "演示" }
  ],
  "requiredExtensions": [],
  "optionalExtensions": [],
  "appTypes": ["*"],
  "minFrameworkVersion": "1.0.0"
}
```

### 完整配置（基于 extension-ad）

```json
{
  "name": "moyan-mfw-extension-ad",
  "version": "0.1.0",
  "displayName": "广告管理",
  "description": "提供广告位管理功能，支持在广告位详情中管理广告内容",
  "routePrefix": "/ext/ad",
  "permCodePrefix": "ext:ad",
  "namespaceName": "广告管理",
  "permCodeNodes": [
    { "permCode": "ad:placement:view", "permName": "查看广告位", "nodeType": "TAG", "group": "广告管理" },
    { "permCode": "ad:placement:create", "permName": "创建广告位", "nodeType": "TAG", "group": "广告管理" },
    { "permCode": "ad:placement:update", "permName": "编辑广告位", "nodeType": "TAG", "group": "广告管理" },
    { "permCode": "ad:placement:delete", "permName": "删除广告位", "nodeType": "TAG", "group": "广告管理" },
    { "permCode": "ad:content:view", "permName": "查看广告内容", "nodeType": "TAG", "group": "广告管理" },
    { "permCode": "ad:content:create", "permName": "创建广告内容", "nodeType": "TAG", "group": "广告管理" },
    { "permCode": "ad:content:update", "permName": "编辑广告内容", "nodeType": "TAG", "group": "广告管理" },
    { "permCode": "ad:content:delete", "permName": "删除广告内容", "nodeType": "TAG", "group": "广告管理" }
  ],
  "provides": {
    "dicts": ["ad_link_type"],
    "entities": ["ext_ad_placements", "ext_ad_contents"]
  },
  "requiredExtensions": [],
  "optionalExtensions": [],
  "appTypes": ["*"],
  "minFrameworkVersion": "1.0.0"
}
```

### 内联形式（main.ts）

Manifest 也可以内联在 `main.ts` 中，与独立文件等效：

```typescript
// src/backend/src/main.ts
const result = await createExtensionBackendApp({
  name: '广告管理',
  module: AdModule,
  entities: [AdPlacement, Ad],
  manifest: {
    name: 'moyan-mfw-extension-ad',
    version: '0.1.0',
    displayName: '广告管理',
    description: '提供广告位管理功能...',
    routePrefix: '/ext/ad',
    permCodeNodes: [ /* ... */ ],
    requiredExtensions: [],
    optionalExtensions: [],
    appTypes: ['*'],
    minFrameworkVersion: '1.0.0',
  },
})
```

---

## 校验规则

框架在 `createExtensionBackendApp` 调用时会执行以下校验（[源码位置](../../../packages/base/src/backend/src/create-extension-backend-app.ts)）：

### 规则 1：必填字段检查

```typescript
const required = ['name', 'version', 'displayName', 'description', 'routePrefix', 'permCodeNodes'] as const
for (const field of required) {
  if (!(manifest as any)[field]) {
    throw new Error(`[Extension] extension.json 缺少必填字段: ${field}`)
  }
}
```

**触发错误示例**：
```
Error: [Extension] extension.json 缺少必填字段: description
```

### 规则 2：routePrefix 格式检查

```typescript
if (!manifest.routePrefix.startsWith('/ext/')) {
  throw new Error(
    `[Extension] routePrefix 必须 /ext/{ns} 格式，当前: "${manifest.routePrefix}"`,
  )
}
```

**触发错误示例**：
```
Error: [Extension] routePrefix 必须 /ext/{ns} 格式，当前: "/api/ad"
```

### 规则 3：permCode 命名空间检查

```typescript
const ns = manifest.routePrefix.replace('/ext/', '')
for (const node of manifest.permCodeNodes) {
  if (!node.permCode || !node.permName) {
    throw new Error(`[Extension] permCodeNode 缺少 permCode 或 permName`)
  }
  if (!node.permCode.startsWith(`${ns}:`)) {
    throw new Error(
      `[Extension] permCode "${node.permCode}" 必须以命名空间 "${ns}" 开头`,
    )
  }
}
```

**触发错误示例**：
```
Error: [Extension] permCode "user:profile:view" 必须以命名空间 "ad" 开头
```

### 校验通过输出

所有规则通过后，控制台输出：

```
[Extension] ✅ 广告管理 v0.1.0 清单校验通过
```

---

## 最佳实践

### 1. 权限粒度设计

**推荐**：按资源 + 操作设计权限节点

```json
{
  "permCodeNodes": [
    { "permCode": "ad:placement:view", "permName": "查看广告位" },
    { "permCode": "ad:placement:create", "permName": "创建广告位" },
    { "permCode": "ad:placement:update", "permName": "编辑广告位" },
    { "permCode": "ad:placement:delete", "permName": "删除广告位" }
  ]
}
```

**避免**：过于粗粒度或过细粒度

```json
// ❌ 过于粗粒度
{ "permCode": "ad:all", "permName": "广告全部权限" }

// ❌ 过于细粒度
{ "permCode": "ad:placement:view:name", "permName": "查看广告位名称" }
```

### 2. 版本管理

- 开发阶段使用 `0.x.x`
- 首次发布稳定版从 `1.0.0` 开始
- 破坏性变更升级 MAJOR 版本
- 新增功能（向后兼容）升级 MINOR 版本
- Bug 修复升级 PATCH 版本

### 3. 依赖声明

- 仅声明实际运行时依赖的扩展
- 避免循环依赖（A → B → A）
- 可选依赖应在代码中处理缺失情况

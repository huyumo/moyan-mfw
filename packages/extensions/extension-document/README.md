# moyan-mfw-extension-document

MFW 通用文档管理扩展包，提供前后端统一的文档管理能力。后端基于 `simple-document` 重新设计，核心改动是引入 **EAV 扩展表**（取代原 `expand: any` JSON blob），业务方可按 `docKey`（文档类型）约定一组 `extKey`，为不同文档类型挂载任意自定义字段，无需改 schema。

## 功能

- 通用文档主表 `mfw_document`（精简 + 统计字段），支持图文/视频
- **EAV 扩展表 `mfw_document_ext`**：键值结构挂载自定义字段（本次重新设计核心）
- 提供 4 个高内聚、开箱即用的前端组件（无路由页面）：
  - `MfwDocumentForm` 文档表单/编辑器（内嵌富文本编辑器）
  - `MfwDocumentList` 文档列表
  - `MfwDocumentDetail` 文档详情/预览
  - `MfwDocumentGroupSelect` 分组/分类选择器
- 提供后端 CRUD / 分页 / 公开接口 / 统计计数 / EAV 字段读写接口
- 基于 RBAC 权限控制

## 安装

```bash
npm install moyan-mfw-extension-document
```

## 使用

### 后端

在业务 `backend/src/app.modules.ts` 中引入：

```typescript
import { DocumentModule } from 'moyan-mfw-extension-document/backend';

@Module({
  imports: [DocumentModule],
})
export class AppModule {}
```

在业务 `backend/src/main.ts` 中收集权限标签：

```typescript
import { DOCUMENT_PERMISSION_VALUES } from 'moyan-mfw-extension-document/backend';

createBaseBackendApp({
  permissionValues: [...DOCUMENT_PERMISSION_VALUES],
  // ...
});
```

模块自动注册路由前缀 `ext/document`。

### 前端

```typescript
import {
  MfwDocumentForm,
  MfwDocumentList,
  MfwDocumentDetail,
  MfwDocumentGroupSelect,
} from 'moyan-mfw-extension-document/frontend';
import { DocumentType, ExtValueType } from 'moyan-mfw-extension-document/shared';
```

组件内部直连 `/api/ext/document/*`，封装加载/提交/分页/删除逻辑，通过 `expose` 暴露控制方法，开箱即用。

### 共享

```typescript
import {
  DocumentType,
  DocumentStatus,
  ExtValueType,
  DOCUMENT_PERMISSION_VALUES,
} from 'moyan-mfw-extension-document/shared';
```

## EAV 扩展表设计

`mfw_document_ext` 采用 EAV（Entity-Attribute-Value）键值结构：

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | bigint PK | 主键 |
| `document_id` | bigint | 外键→`mfw_document.id` |
| `ext_key` | varchar(128) | 属性键 |
| `ext_value` | json | 属性值 `{ data: any }` |
| `value_type` | varchar(16) | 值类型（string/number/boolean/json） |
| `description` | varchar(256) | 描述 |

业务方按 `docKey`（文档类型）约定一组 `extKey`，在前端 `MfwDocumentForm` 通过 `extFields` 配置驱动渲染，即可为不同文档类型挂载任意自定义字段。

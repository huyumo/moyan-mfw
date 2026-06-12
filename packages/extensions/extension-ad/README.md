# moyan-mfw-extension-ad

MFW 广告管理扩展包，基于 `moyan-mfw-base` 提供完整的广告管理功能。

## 安装

```bash
npm install moyan-mfw-base moyan-mfw-extension-ad
# or
pnpm add moyan-mfw-base moyan-mfw-extension-ad
```

> ⚠️ 本扩展依赖 `moyan-mfw-base`，需要同时安装。

## 入口模块

| 入口 | 说明 |
|------|------|
| `moyan-mfw-extension-ad/backend` | 广告后端模块（AdModule、Entity、Service、DTO） |
| `moyan-mfw-extension-ad/frontend` | 广告前端路由与组件 |
| `moyan-mfw-extension-ad/shared` | 共享类型、字典、权限值、API 路径 |

## 快速开始

### 后端

```typescript
// main.ts
import { createBaseBackendApp } from 'moyan-mfw-base/backend';
import { AdModule } from 'moyan-mfw-extension-ad/backend';
import { AD_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-ad/shared';

const app = await createBaseBackendApp({
  modules: [AdModule],
  permissions: AD_EXTENSION_PERMISSION_VALUES,
});
```

### 前端

```typescript
// main.ts
import { createBaseAdminApp } from 'moyan-mfw-base/frontend';
import { adRoutes } from 'moyan-mfw-extension-ad/frontend';

const app = createBaseAdminApp({
  routes: adRoutes,
});
```

## 功能

- **广告管理**：创建、编辑、删除、排序广告
- **广告位管理**：管理广告位及其类型配置
- **链接类型字典**：`AdLinkTypeDict` — 支持外部链接 / 内部路由等链接类型

## License

MIT

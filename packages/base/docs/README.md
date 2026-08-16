# moyan-mfw-base 使用文档

> 墨焱 MFW 核心框架包（moyan-mfw-base）的完整使用手册。
> 本文档随 npm 包一起发布，适用于当前版本 `1.2.x`。

`moyan-mfw-base` 是一个全栈管理框架基础包：后端基于 NestJS + TypeORM + MySQL + Redis + JWT，前端基于 Vue 3 + Element Plus + Vite，并提供前后端共享的类型与字典框架。它通过三个入口对外提供服务：

| 入口 | 说明 |
|------|------|
| `moyan-mfw-base/backend` | 后端框架：应用工厂、装饰器、守卫、拦截器、过滤器、核心实体/服务、SPI、分页查询、缓存 |
| `moyan-mfw-base/frontend` | 前端框架：应用工厂、路由（菜单树）、布局与主题、组件库、Store、指令、Composables |
| `moyan-mfw-base/shared` | 共享层：装饰器式字典框架、内置字典、菜单树等共享类型 |

## 文档导航

### 入门

| 文档 | 内容 |
|------|------|
| [01-快速开始](./01-quick-start.md) | 安装、三端最小可用示例 |
| [02-核心概念](./02-core-concepts.md) | 权限模型（位运算 RBAC）、多租户（AppType/App）、菜单树、请求流水线 |

### 后端（`/backend` 入口）

| 文档 | 内容 |
|------|------|
| [后端总览](./03-backend/README.md) | 后端架构、模块结构、内置能力清单 |
| [应用工厂与配置](./03-backend/app-factory.md) | `createBaseBackendApp` / `createExtensionBackendApp` 完整选项、环境变量 |
| [装饰器](./03-backend/decorators.md) | `@Public` / `@Permission` / `@AuditLog` / `@User` / `@AppId` / `@AppInfo` / `@SkipPermission` 等 |
| [守卫·过滤器·拦截器](./03-backend/guards-filters-interceptors.md) | 认证/权限守卫、全局异常过滤器、响应包装、审计 |
| [权限体系](./03-backend/permissions.md) | 权限值注册、位运算工具、权限池、内置角色 |
| [SPI 集成](./03-backend/spi.md) | 实体管理 SPI 与事件总线（业务层/框架层双入口） |
| [分页与查询](./03-backend/pagination-query.md) | `PaginationX` / `WhereBuilder` / `QueryBuilderHelper` / `executeRawSql` |
| [实体与服务](./03-backend/entities-services.md) | `Base` 实体、核心实体、核心服务 |
| [缓存](./03-backend/cache.md) | CacheModule、`@Cacheable` / `@CacheEvict`、Redis/Memory 驱动 |
| [文件上传与 OSS](./03-backend/upload.md) | 上传接口、OSS 直传授权 |
| [内置系统 API](./03-backend/sys-apis.md) | auth / users / roles / permissions / apps / app-types / members / audit-log / install / route-sync / health |
| [后端使用规范](./03-backend/conventions.md) | 控制器/服务/实体/权限/审计等编写规范 |

### 前端（`/frontend` 入口）

| 文档 | 内容 |
|------|------|
| [前端总览](./04-frontend/README.md) | 前端架构、启动流程、目录约定 |
| [应用工厂与入口](./04-frontend/app-factory.md) | `createBaseAdminApp` / `createExtensionFrontendApp` 完整选项与 main.ts 模板 |
| [路由与菜单树](./04-frontend/routing.md) | menuTrees 配置、路由生成、守卫、RouteSyncButton |
| [布局与主题](./04-frontend/layout-theme.md) | 布局模式、偏好设置、9 套内置主题、自定义主题 |
| [前端权限](./04-frontend/permissions.md) | 权限值注册、页面权限、`v-permission` 指令、`usePermission` |
| [Store](./04-frontend/stores.md) | `useAuthStore` / `useLayoutStore` / `useAppLoadingStore` |
| [API 调用层](./04-frontend/api-layer.md) | moyan-api 适配器、自动携带 Token / X-App-Id、401 自动刷新 |
| [组件总览](./04-frontend/components/README.md) | 组件命名规范与完整清单 |
| [展示类组件](./04-frontend/components/display.md) | MfwFormat / MfwDateFormat / MfwDictFormat / MfwTagFormat / MfwImageFormat / MfwDetail / MfwUserFormat / MfwCardPanel / ParticleBackground |
| [表单类组件](./04-frontend/components/form.md) | MfwFormCard（点分 key、分组、动态显隐） |
| [表格类组件](./04-frontend/components/table.md) | MfwTableList、ActionButtons |
| [页面类组件](./04-frontend/components/page.md) | MfwPageWrapper / MfwListPage / MfwCardListPage / MfwSearchPanel / MfwBaseListPage |
| [选择器组件](./04-frontend/components/picker.md) | MfwAppSelector / MfwUserPicker / MfwIconPicker / MfwRadioGroup / MfwAlimapPicker |
| [编辑器组件](./04-frontend/components/editor.md) | MfwMdEditor / MfwJsonEditor / MfwQuillEditor |
| [上传组件](./04-frontend/components/upload.md) | MfwUpload / MfwImageSingle / MfwImageGallery / MfwVideoSingle |
| [反馈类组件](./04-frontend/components/feedback.md) | MfwPopup（命令式弹窗） |
| [业务类组件](./04-frontend/components/business.md) | RouteSyncButton / AppSelectorDialog / PermissionTree / RolePermissionPanel 等 |
| [前端使用规范](./04-frontend/conventions.md) | 组件命名、页面组织、权限、上传等规范 |

### 共享层（`/shared` 入口）

| 文档 | 内容 |
|------|------|
| [共享层](./05-shared/README.md) | 字典框架、内置字典、共享类型 |

### 变更与废弃

| 文档 | 内容 |
|------|------|
| [已废弃 API 与迁移说明](./06-deprecated.md) | 历次迭代中已废弃/移除的 API 清单、替代方案、迁移指引 |

## 快速参考

```typescript
// 后端
import { createBaseBackendApp } from 'moyan-mfw-base/backend';

// 前端
import { createBaseAdminApp, registerPermissionValues } from 'moyan-mfw-base/frontend';

// 共享层
import { DictMeta, DictEntry, toItems } from 'moyan-mfw-base/shared';
```

> 完整可运行示例见仓库 `demo/` 目录（业务后端、业务前端、业务共享层）。

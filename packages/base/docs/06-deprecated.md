# 已废弃 API 与迁移说明

> 框架经过多轮迭代，以下 API 已废弃或行为发生变化。本文档是**过时代码分析结论**，帮助老项目迁移到当前版本。

## 一、路由体系（破坏性变更）

### 已废弃

| 旧 API | 废弃版本 | 替代方案 |
|--------|----------|----------|
| `views/**/index.ts` 导出 `definePageConfig({ page, path, name, permissions })` | v1.2.0 | 集中配置 `menu-trees.ts`，节点内联 `component` |
| `import.meta.glob` 自动扫描路由 | v1.2.0 | `buildRoutesFromMenuTrees(menuTrees)` |
| `buildRoutesFromConfigs()` | v1.2.0 | 移除（menuTrees 自动构建） |
| 框架自动挂载内置系统页面路由 | v1.2.0 | 在 menuTrees 中显式引入 `SysUserPage` 等 |

### 迁移步骤

1. 新建 `src/menu-trees.ts`，按 AppType 组织菜单树（`appTypeCode` / `roleCode` / `label` / `children`）。
2. 把原 `index.ts` 的 `page` 组件与 `permissions` 内联到菜单节点。
3. `main.ts` 传入 `menuTrees`，删除自动扫描代码。
4. 菜单树变更后用 `RouteSyncButton` 同步权限。

## 二、前端应用工厂

| 旧 API | 状态 | 替代方案 |
|--------|------|----------|
| `createBaseAdminApp({ routes: [...] })` 作为主配置 | 过时 | `menuTrees` 是路由主数据源；`routes` 仅用于覆盖/追加额外路由 |
| `loginExtensions`（登录页扩展组件） | 已移除 | `loginComponent`（自定义整个登录页），复用 `useLoginPage()` |
| `createExtensionFrontendApp({ routes })` | 过时 | `createExtensionFrontendApp({ menuTrees })` |
| `definePageConfig` 页面配置函数 | 不再参与路由 | `createBusinessPageConfigFn(values)` 仅用于注册业务权限值（可选） |

## 三、后端应用工厂选项（类型保留但未消费）

`CreateBaseBackendAppOptions` 中以下选项**当前实现不会处理**，使用会静默失效：

| 选项 | 说明 | 替代方案 |
|------|------|----------|
| `security` | 安全配置 | 自行在业务模块注册 Helmet 等 |
| `logger` | 日志配置 | 全局 LoggingInterceptor 已内置；自定义日志用 Nest Logger |
| `userAttributes` / `memberAttributes` | 扩展属性 | 业务扩展实体 + 关联（如 `supplier_member_profile`） |
| `permissions` | 权限配置（已标注废弃） | `permissionValues` |
| `seeds` | 种子数据 | `runSeeds()` / `seedDicts()` 手动调用 |
| `middlewares` / `exceptionFilters` / `interceptors` | 中间件/过滤器/拦截器 | `providers` + `APP_FILTER` / `APP_INTERCEPTOR` / 显式注册 |
| `migrations` | 迁移配置 | 自行集成 TypeORM migration runner |
| `auditLog` | 审计配置 | `@AuditLog` 装饰器 + 显式注册 `AuditInterceptor` |

## 四、后端装饰器与守卫

| 旧 API | 状态 | 替代方案 |
|--------|------|----------|
| `@NoAuth` / `@IgnoreAuth` | 已移除 | `@Public()` |
| 控制器使用 `@Req()` / `@Res()` 取用户 | 禁止（ESLint） | `@User()` / `@AppId()` / `@AppInfo()` |
| `@RequirePermission('code')` 字符串形式 | 保留兼容 | 推荐 `createBusinessPermissionDecorator` 生成的 `@Permission` |

## 五、前端组件与工具

| 旧 API | 状态 | 替代方案 |
|--------|------|----------|
| `MfwPageScene` | 兼容别名 | `MfwListPage` |
| `MfwPopup` 的 `data` 属性 | 已废弃（标注 @deprecated） | `elProps` |
| `definePageConfig` 页面级 `permissionValue` | 不再需要 | 菜单树 `permissions` 自动计算 |
| `setPermissionConfig` | 保留 | 推荐 `registerPermissionValues` |## 六、数据字段命名

| 旧命名 | 当前命名 | 说明 |
|--------|----------|------|
| `deleteAt` | `deletedAt` | Base 实体软删除字段（历史 SQL 迁移脚本中曾出现旧命名） |

## 七、包与入口变更

| 旧包名 | 当前包名 |
|--------|----------|
| `moyan-mfw-base-frontend`（独立包） | 合并进 `moyan-mfw-base/frontend` 入口 |
| `moyan-base-backend` / `moyan-base-frontend`（早期命名） | `moyan-mfw-base/backend` / `moyan-mfw-base/frontend` |

## 八、仓库历史文档清理说明

仓库 `docs/` 下以下文档为早期版本编写（使用旧包名/旧 API），已在文档索引中标记并清理：

- `docs/前端/前端基础设施包.md`（旧包名 `moyan-mfw-base-frontend`、旧 `routes` 配置）
- `docs/前端/权限体系.md`（早期权限模型）
- `docs/API/接口文档.md`、`docs/API/数据模型.md`、`docs/API/前端API调用层.md`（端点/模型过时）
- `docs/后端/后端服务.md`（旧包名 `moyan-base-backend`）

当前权威文档为**本包随 npm 发布的 `docs/` 目录**（即本手册）。

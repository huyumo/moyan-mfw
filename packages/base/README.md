# moyan-mfw-base

墨焱 MFW 核心框架包（`moyan-mfw-base`），为后台管理系统提供开箱即用的全栈能力：

- **后端**（NestJS + TypeORM + MySQL + Redis + JWT）：应用工厂、RBAC 位运算权限、多租户（AppType/App）、审计日志、SPI 集成、分页查询、缓存、上传/OSS
- **前端**（Vue 3 + Element Plus + Vite）：应用工厂、菜单树路由、布局与主题、配置化组件库、Pinia Store、权限指令、moyan-api 适配器
- **共享层**：装饰器式字典框架、菜单树等共享类型（前后端同构）

## 安装

```bash
npm install moyan-mfw-base
# 或
pnpm add moyan-mfw-base
```

> 需要 Node.js >= 20；peerDependency：`moyan-api`。

## 入口

| 入口 | 说明 |
|------|------|
| `moyan-mfw-base/backend` | 后端框架：工厂、装饰器、守卫、服务、SPI、查询工具 |
| `moyan-mfw-base/frontend` | 前端框架：工厂、组件库、Store、指令、主题 |
| `moyan-mfw-base/shared` | 共享层：字典框架与类型 |

## 快速开始

### 后端

```typescript
import { createBaseBackendApp } from 'moyan-mfw-base/backend';

const app = await createBaseBackendApp({
  name: '我的业务后端',
  modules: [AppModule],
  appTypes: appTypesConfig,   // 业务应用类型
  syncAppTypes: true,
  permissionValues: ['上架', '发货'],
  swagger: [{ name: 'my-api', title: '我的 API', include: [AppModule] }],
});

await app.listen(3000);
```

### 前端

```typescript
import { createBaseAdminApp, registerPermissionValues } from 'moyan-mfw-base/frontend';
import { menuTrees } from './menu-trees';

registerPermissionValues(['上架', '发货']);

const admin = createBaseAdminApp({
  title: '我的业务前端',
  menuTrees,                        // 路由与权限的唯一数据源
  layout: { layoutMode: 'sidebar', themePackage: 'tech' },
});

const values = await admin.fetchPermissionValues();
admin.initPermissionCache(values);
await admin.mount('#app');
```

### 共享层（字典）

```typescript
import { DictMeta, DictEntry, toItems } from 'moyan-mfw-base/shared';

@DictMeta({ key: 'gender', label: '性别' })
class GenderDict {
  @DictEntry({ label: '男' }) static MALE = 1;
  @DictEntry({ label: '女' }) static FEMALE = 2;
}

toItems(GenderDict); // [{ value: 1, label: '男' }, { value: 2, label: '女' }]
```

## 文档

完整使用手册随 npm 包发布，位于包内 `docs/` 目录，从 [docs/README.md](./docs/README.md) 开始阅读：

- [快速开始](./docs/01-quick-start.md)
- [核心概念（权限/多租户/菜单树）](./docs/02-core-concepts.md)
- 后端：应用工厂、装饰器、守卫/拦截器、权限体系、SPI、分页查询、缓存、上传、系统 API、规范（[docs/03-backend](./docs/03-backend/README.md)）
- 前端：应用工厂、路由与菜单树、布局与主题、权限、Store、API 层、全部组件用法、规范（[docs/04-frontend](./docs/04-frontend/README.md)）
- 共享层：字典框架与内置字典（[docs/05-shared](./docs/05-shared/README.md)）
- [已废弃 API 与迁移说明](./docs/06-deprecated.md)

> 可运行示例见仓库 `demo/` 目录（业务后端 / 业务前端 / 业务共享层）。

## 核心特性

- **权限体系**：RBAC + BigInt 位运算，页面到按钮级细粒度控制，开发者模式
- **多租户**：AppType（应用类型）/ App（应用实例）/ 成员三级模型，AppType 路由隔离
- **菜单树**：前端唯一数据源，一次配置生成路由、侧边栏与后端权限数据
- **SPI 集成**：业务实体与框架应用/成员/用户状态双向同步
- **组件库**：列表页 / 表单卡 / 弹窗 / 上传 / 编辑器 / 选择器等配置化组件
- **审计日志**：`@AuditLog` 装饰器 + AuditInterceptor
- **字典框架**：装饰器式定义，前后端同构
- **软删除**：Base 实体自带 `createdAt` / `updatedAt` / `deletedAt`

## License

MIT

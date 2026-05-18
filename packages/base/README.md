# moyan-mfw-base

墨焱 MFW 核心框架包，为后台管理系统提供开箱即用的全栈能力。

## 安装

```bash
npm install moyan-mfw-base
# or
pnpm add moyan-mfw-base
```

## 入口模块

| 入口 | 路径 | 说明 |
|------|------|------|
| `moyan-mfw-base/backend` | NestJS 后端框架 | Guards、Interceptors、Filters、Decorators、Entities、Services |
| `moyan-mfw-base/frontend` | Vue 3 前端框架 | 组件库、Store、Composables、Directives、主题系统 |
| `moyan-mfw-base/shared` | 共享层 | 字典框架、类型定义 |

## 快速开始

### 后端

```typescript
import { createBaseBackendApp } from 'moyan-mfw-base/backend';

const app = await createBaseBackendApp({
  modules: [],          // 业务模块
  providers: [],        // 自定义 Provider
  permissions: {},      // 权限编码
  appTypesConfig: {},   // 应用类型配置
  swagger: { title: 'My API', version: '1.0' },
});

await app.listen(3000);
```

### 前端

```typescript
import { createBaseAdminApp } from 'moyan-mfw-base/frontend';

const app = createBaseAdminApp({
  pageConfigs: {},      // 页面路由配置
  permissions: {},      // 前端权限编码
  theme: 'default',     // 主题包
  modules: [],          // 业务模块
});

app.mount('#app');
```

### 共享层（字典）

```typescript
import { DictMeta, DictEntry, toItems } from 'moyan-mfw-base/shared';

@DictMeta({ name: 'gender' })
class Gender {
  @DictEntry({ label: '男', value: 1 })
  static MALE: number;

  @DictEntry({ label: '女', value: 2 })
  static FEMALE: number;
}

const items = toItems(Gender); // [{ label: '男', value: 1 }, { label: '女', value: 2 }]
```

## 核心特性

- **权限体系**：RBAC + BigInt 位运算，支持到按钮级别的细粒度控制
- **多租户**：应用类型 / 应用实例 / 角色三级隔离
- **审计日志**：`@AuditLog` 装饰器自动记录操作日志
- **分页查询**：`PaginationX` 链式 API，TypeORM 原生集成
- **前端路由**：`import.meta.glob` 自动扫描页面配置，零手动注册
- **主题系统**：9 套内置主题（`getTheme` / `useColorMode` / `useThemeSwitch`）
- **字典框架**：装饰器式定义，前后端同构渲染
- **软删除**：Base 实体自带 `createdAt` / `updatedAt` / `deletedAt`

## 文档

- [后端 API 参考](../../docs/api-reference/backend/README.md)
- [前端 API 参考](../../docs/api-reference/frontend/README.md)
- [共享层 API 参考](../../docs/api-reference/shared/README.md)
- [开发规范](../../docs/development-standards/README.md)

## License

MIT

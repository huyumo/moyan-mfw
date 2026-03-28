# moyan-mfw-base-frontend

## 升级说明

### 命名规范调整（2026-03-15）

为满足前端命名门禁，以下兼容入口已移除：

- `app/store/layout.store.ts`
- `app/types/layout.types.ts`

请改用 kebab-case 入口：

- `moyan-mfw-base-frontend/app/store/layout-store`
- `moyan-mfw-base-frontend/app/types/layout-types`

### 登录扩展能力

`loginExtensions` 现支持两种输入方式：

- 直接传入 Vue 组件
- 传入异步配置对象：`{ loader: () => import('...'), timeout?: number }`

异步扩展会自动显示加载态与错误态。

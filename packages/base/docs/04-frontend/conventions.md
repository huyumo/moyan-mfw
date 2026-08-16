# 前端 · 使用规范

## 目录结构

```
frontend/src/
├── main.ts                  # 入口：createBaseAdminApp
├── menu-trees.ts            # 菜单树（路由 + 权限唯一数据源）
├── permissions.ts           # 业务页面配置工厂（可选）
├── themes.ts                # 业务主题（可选）
├── components/              # 业务通用组件（Mfw 前缀）
├── views/                   # 页面组件
└── types/                   # 类型定义
```

## 路由与菜单规范

1. 页面路由**只能**通过 `menu-trees.ts` 声明（旧版 `views/**/index.ts` + `definePageConfig` + `import.meta.glob` 已废弃）。
2. PAGE 节点必须提供 `component`；MENU 分组不需要。
3. 页面路径首段为 appTypeCode（`/{appTypeCode}/...`），不要自定义顶级路径。
4. 业务 AppType 菜单树必须声明 `roleCode`，否则不会同步权限。
5. 需要操作权限的页面节点声明 `permissions: ['添加', '编辑', '删除']`（与后端装饰器使用同一组名称）。

## 组件规范

1. 业务通用组件命名 `Mfw` 前缀 + PascalCase；目录 kebab-case。
2. TSX 组件在 `components/` 下必须 `Mfw` 前缀（ESLint 强制）。
3. 列表页用 `MfwListPage`，表单用 `MfwFormCard`，弹窗用 `MfwPopup`。
4. 按钮权限用 `v-permission` 指令或 `usePermission()`；不要手写 `if (user.xxx)` 判断。

## 权限规范

1. 权限名称常量定义在共享层（`moyan-mfw-shared` 的 `BUSINESS_PERMISSION_VALUES`），前后端共用。
2. `main.ts` 中 `registerPermissionValues(...)` 注册业务权限值。
3. `admin.fetchPermissionValues()` + `admin.initPermissionCache()` 必须执行（v-permission 依赖）。
4. 菜单树变更后点击 `RouteSyncButton` 同步权限。

## API 调用规范

1. 业务 API 使用 moyan-api 的 ApiEntity 类（`new ApiXxx({ body/query })`），自动携带 Token / X-App-Id / 401 刷新。
2. 不要自己封装 axios（重复拦截器）；特殊场景用 `fetch` + `getAccessToken()`。
3. 文件下载用 ApiEntity + `fileName` 选项（自动触发下载）。

## 主题规范

1. 业务主题在 `src/themes.ts` 定义并注册到 `themeRegistry`；字段见 [布局与主题](./layout-theme.md)。
2. 颜色尽量使用语义 token（`--el-color-*` / CSS 变量），避免硬编码色值。

## 测试与质量

1. 组件测试参考 `packages/base/src/frontend/src/components/display/mfw-format/__tests__/`。
2. 运行 `pnpm typecheck:vue` 检查类型；`pnpm format` 统一格式。
3. 文件行数限制：TS 1000 行、类型 200 行（根目录 lint 配置）。

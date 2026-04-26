---
version: "1.0"
last_updated: "2026-04-25"
scope: auth
triggers:
  - 路由
  - 守卫
  - 菜单
  - 页面注册
  - definePageConfig
  - defineModuleConfig
dependencies:
  - auth/permission-debugging
maturity: stable
tags: [路由, 守卫, 菜单, 页面注册, 前端, 权限]
---

# 路由与守卫

## 自动扫描原理

框架使用 `import.meta.glob` 扫描 `views/` 目录：

1. 扫描所有 `views/**/index.{ts,tsx}` 文件
2. 判断导出是 `ModuleConfig`（type='module'）还是 `PageConfig`（含 page/path/name）
3. PageConfig 自动转为 Vue Router 路由记录
4. ModuleConfig 自动作为菜单分组，子页面挂在其下
5. 基包路由和业务路由合并，业务路由优先覆盖同名路径

## 路由结构

```
/login           → 登录页（Public）
/install         → 系统初始化页（Public）
/                → AdminLayout（需认证）
  /dashboard     → 看板
  /sys           → 系统管理模块（EmptyLayout）
    /sys/user    → 用户管理
    /sys/role    → 角色管理
    ...
/403             → 权限不足
/404             → 页面不存在
/*               → 重定向到 /404
```

## 路由守卫流程

```
1. 检查系统初始化状态 → 未初始化跳 /install
2. 系统已初始化 → 禁止访问 /install
3. 白名单路由 → 直接放行（/login, /install, /403, /404）
4. 检查 Token → 无 Token 跳 /login（带 redirect 参数）
5. 首次访问 → initializeAuth()（获取用户信息→获取应用列表→自动选择应用）
6. 检查页面权限 → 比对权限菜单 → 无权限跳 /403
```

## Token 机制

- 存储键：`mfw:admin:token` / `mfw:admin:refresh_token`
- 当前应用存储：`mfw:admin:current_app`
- 10 分钟内过期自动刷新

## 页面配置

```typescript
import { definePageConfig } from '../../../router/routes';

export default definePageConfig({
  page: XxxList,
  path: 'xxx',
  name: 'XXX管理',
  icon: 'Document',
  auth: true,
  order: 1,
  permissions: ['添加', '编辑', '删除'],
});
```

## 模块配置

```typescript
import { defineModuleConfig } from '../../router/routes';

export default defineModuleConfig({
  type: 'module',
  name: '模块名称',
  icon: 'Setting',
  order: 100,
});
```

## 反模式（Red Flags）— 立即停止

- ✋ 手动在 router 配置中添加路由 → 路由由框架自动扫描 `views/` 目录注册
- ✋ 页面目录缺少 `index.ts` → 路由扫描依赖 `index.ts`，缺失则页面不注册
- ✋ 忘记设置 `auth: true` → 页面无需认证即可访问
- ✋ Token 存储键硬编码 → 使用常量 `mfw:admin:token` / `mfw:admin:refresh_token`
- ✋ 在路由守卫中做业务逻辑 → 守卫只做认证/权限检查，业务逻辑放页面组件

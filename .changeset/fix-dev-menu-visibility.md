---
"moyan-mfw-base": patch
---

fix(frontend): showMode=DEV 菜单在未开启开发者模式下仍然可见

- 应用选择弹窗：删除重复实现的权限拉取与菜单转换（未过滤 DEV/不可见节点，会覆盖 selectApp→loadPermissions 产出的已过滤菜单），统一复用 auth-store 的过滤链路
- 启动菜单：createMenuTreeFromRoutes 跳过 showMode=DEV 路由（启动菜单构建先于认证初始化，开发者模式必然未开启；登录后菜单由 loadPermissions 按服务端权限树重建）

---
"moyan-mfw-base": patch
---

fix(frontend): 零应用账号登录后被重定向死循环锁死在 404（下游缺陷报告 Route-01/Route-02）

- 路由守卫：已登录但未分配任何应用的账号访问 `/login` 放行，不再踢回 `/`（此前 `/` → RootRedirect → `/dashboard` → catch-all 404 绕回原页，异常页「前往登录/切换账号」按钮全部失效，账号被永久锁死）
- 登录编排：`handlePostLogin` 对零应用账号提示"该账号尚未分配任何应用，请联系管理员分配后再登录"，清除登录态并停留在登录页，不再跳 `/`
- RootRedirect 兜底：零应用账号访问 `/` 直接送回 `/login`，不依赖下游存在全局 `/dashboard` 路由

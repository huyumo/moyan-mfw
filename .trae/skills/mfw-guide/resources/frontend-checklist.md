---
version: "1.0"
last_updated: "2026-04-26"
scope: resources
triggers:
  - 前端清单
  - 验证清单
  - 4项清单
dependencies:
  - frontend/new-frontend-page
maturity: stable
tags: [前端, 清单, 验证, 4项]
---

# 前端页面清单（4 项）

1. `views/模块名/页面名/Index.vue` — 页面组件（使用 MfwPageWrapper + MfwListPage/CardListPage）
2. `views/模块名/页面名/index.ts` — 页面配置（definePageConfig）
3. `views/模块名/index.ts` — 模块配置（defineModuleConfig，已有则跳过）
4. 在组件目录创建 `mod.ts` 并在 `components/index.ts` 导出（如新增组件）

路由和菜单由框架自动扫描注册，无需手动配置。

## 反模式（Red Flags）— 立即停止

- ✋ 漏掉清单中的任何一项 → 完整实现 4 项，不可跳过
- ✋ 新增页面后忘记在模块目录放 `index.ts` → 路由自动扫描依赖 `index.ts`

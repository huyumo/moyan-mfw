---
version: "1.0"
last_updated: "2026-04-26"
scope: shared
triggers:
  - 修改 apis 目录
  - API 类型不正确
  - 新增 API 方法
  - api:build
dependencies: []
maturity: stable
tags: [apis, 红线, 前端, 后端]
---

# apis 目录红线规则

## 核心禁令

**禁止手动编写或改动 `apis` 目录下的任何文件。**

## 原因

`apis` 目录存放的是由 `moyan-api` 工具自动生成的 API 代码，任何手动修改都会被后续生成覆盖。

## 常见违规场景与正确做法

- ✋ API 返回类型不正确 → 不要直接改 `apis/sys/schemas.ts`，修改后端 DTO/响应类型后运行 `pnpm run api:build`
- ✋ 需要新增 API 方法 → 不要在 `apis/sys/` 下手动添加，修改后端 Controller 后运行 `pnpm run api:build`
- ✋ API 路径不对 → 不要改 `apis/sys/` 下的 URL，修改后端 Controller 路由后运行 `pnpm run api:build`
- ✋ 想加一个类型导出 → 不要在 `apis/sys/index.ts` 加 export，修改后端后运行 `pnpm run api:build`
- ✋ 只是改一个小注释 → 不要直接改，下次自动生成会覆盖

## 重新生成

```bash
pnpm run api:build
```

## 反模式（Red Flags）— 立即停止

- ✋ 手动编辑 `apis/` 目录下的任何文件 → 修改后端后运行 `pnpm run api:build`
- ✋ 想到"只是微调一下自动生成的代码" → 停止，去修改后端代码
- ✋ 准备在 `apis/` 下新建文件 → 修改后端 Controller，重新生成
- ✋ 想修改 API 的类型定义来修复前端报错 → 修改后端 DTO，重新生成
- ✋ 直接改 `apis/sys/schemas.ts` 中的类型 → 任何修改都会被下次生成覆盖

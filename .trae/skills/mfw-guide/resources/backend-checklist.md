---
version: "1.0"
last_updated: "2026-04-26"
scope: resources
triggers:
  - 后端清单
  - 验证清单
  - 13项清单
dependencies:
  - backend/new-backend-module
maturity: stable
tags: [后端, 清单, 验证, 13项]
---

# 后端模块清单（13 项）

1. `entities/xxx.entity.ts` — 实体（继承 Base，UUID 主键，软删除）
2. `dto/req/create-xxx.dto.ts` — 创建 DTO（@ApiProperty + class-validator）
3. `dto/req/update-xxx.dto.ts` — 更新 DTO
4. `dto/req/query-xxx.dto.ts` — 查询 DTO（继承 PaginationQueryDto）
5. `dto/res/xxx-response.dto.ts` — 响应 DTO
6. `dto/index.ts` — 统一导出
7. `xxx.service.ts` — 业务逻辑（PaginationX + WhereBuilder + 事务）
8. `xxx.controller.ts` — 控制器（@ApiTags + @RequirePermission + @AuditLog）

> 单实体模块扁平放置，多实体模块使用子目录

9. `xxx.module.ts` — 模块定义
10. 在 `modules/sys/index.ts` 中导出
11. 在 `app.module.ts` 中导入
12. 在 `common/constants/permissions.ts` 中添加权限编码
13. 重新生成前端 API：`pnpm run api:build`

## 反模式（Red Flags）— 立即停止

- ✋ 漏掉清单中的任何一项 → 完整实现 13 项，不可跳过
- ✋ 新增模块后忘记运行 `pnpm run api:build` → 修改后端后必须重新生成前端 API

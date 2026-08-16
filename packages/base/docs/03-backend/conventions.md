# 后端 · 使用规范

## 目录结构

```
backend/src/
├── main.ts                  # 入口：createBaseBackendApp
├── app.modules.ts           # 根模块：汇总业务模块
├── app-types.config.ts      # 应用类型配置
├── permissions.ts           # 业务权限装饰器工厂（唯一入口）
└── modules/
    └── <domain>/
        ├── <domain>.module.ts
        ├── <domain>.controller.ts
        ├── <domain>.service.ts
        ├── dto/req/  dto/res/
        ├── entities/
        └── spi/             # SPI 自定义实现/监听器（如有）
```

## 控制器规范

1. 类上：`@ApiTags('模块名')` + `@Controller('路径')` + 类级 `@Permission('模块:权限点')`。
2. 方法上：`@ApiOperation` 描述接口；需要额外操作权限时叠加 `@Permission(code, ['操作名'])`。
3. 返回原始数据（框架统一包装），不要手动 `ApiResponseUtil.success` 以外的包装（`ApiResponseUtil.success` 用于控制器显式包装）。
4. 禁止使用 `@Req()` / `@Res()` / `@Request()` / `@Response()`；用 `@User()` / `@AppId()` / `@AppInfo()`。
5. Swagger 装饰器从 `moyan-mfw-core` 导入（ESLint 强制）。
6. 写操作（增删改）加 `@AuditLog`（需注册 `AuditInterceptor`）。

## 服务规范

1. 业务实体管理（如商家）通过 `AppEntitySpi` / `UserEntitySpi` 同步框架状态，注意**补偿回滚**（业务保存失败时删除已建应用）。
2. 涉及多表写操作使用 TypeORM 事务（`dataSource.transaction`）。
3. 查询排序统一 `createdAt: 'DESC'` 风格；分页接口使用 `PaginationQueryDto` 子类。

## 实体规范

1. 继承 `Base`（软删除 + 时间戳），主键 `uuid`。
2. 字段加 `comment`；长度/类型明确（`varchar` 给长度，JSON 用 `type: 'json'`）。
3. 业务扩展字段不要写进 `sys_*` 表，用业务扩展表 + 外键关联。

## 权限规范

1. 权限名称统一在 `permissions.ts`（后端）与业务 `moyan-mfw-shared`（共享常量）定义，`as const` 声明。
2. 前端 `menu-trees.ts` 的 `permissions` 与后端装饰器使用同一组名称。
3. 权限点编码建议 `模块:子模块`（如 `supplier:manage`）或自定义 `ext:xxx`。
4. 变更菜单树后通过 RouteSyncButton 重新同步权限。

## 其他

1. 单文件不超过 1000 行（ESLint/文件限制）；类型定义文件不超过 200 行。
2. 依赖版本使用 workspace `catalog:` 与 `workspace:*` 约定（见根 AGENTS.md）。
3. 数据库迁移放 `database/migrations/`，种子放 `database/seeds/`。

# 后端总览（`moyan-mfw-base/backend`）

## 架构

基于 NestJS + TypeORM + MySQL + Redis + JWT。`createBaseBackendApp()` 一个函数完成全部初始化：

```
createBaseBackendApp(options)
  ├─ CacheModule（CACHE_DRIVER）
  ├─ ConfigModule（.env / 自定义配置）
  ├─ TypeOrmModule（MySQL，业务实体自动注册）
  ├─ JwtModule（全局）
  ├─ SysModule（@Global：认证/用户/角色/权限/应用/审计/上传/路由同步）
  ├─ HealthModule
  ├─ 业务 modules / moduleRoutes / providers / extraEntities
  ├─ APP_GUARD: AuthGuard → PermissionGuard
  ├─ APP_INTERCEPTOR: CacheInterceptor → AppInfoInterceptor
  ├─ 全局: LoggingInterceptor → TransformInterceptor + AllExceptionsFilter + ValidationPipe
  ├─ BigInt 序列化 / CORS / 静态资源 / Swagger 分组
  └─ 权限值注册 + 应用类型同步 + 生命周期钩子
```

## 导出内容

| 分类 | 内容 |
|------|------|
| 应用工厂 | `createBaseBackendApp` / `createExtensionBackendApp` |
| 装饰器 | `@Public` / `@RequirePermission` / `createBusinessPermissionDecorator` / `@SkipPermission` / `@User` / `@AppId` / `@AppInfo` / `@AuditLog` / `@ApiPaginatedResponse` / `@Cacheable` / `@CacheEvict` |
| 守卫 | `AuthGuard` / `PermissionGuard` |
| 拦截器 | `LoggingInterceptor` / `TransformInterceptor` / `AuditInterceptor` / `AppInfoInterceptor` / `CacheInterceptor` |
| 过滤器 | `AllExceptionsFilter` |
| 异常 | `BusinessException` / `NotFoundError` / `ForbiddenError` / `UnauthorizedError` |
| 实体 | `Base` / `UserEntity` / `Role` / `Permission` / `AppType` / `App` / `AppMember` / `AuditLog` |
| 服务 | `AuthService` / `UserService` / `RoleService` / `PermissionService` / `AppService` / `AppMemberService` / `AppTypeService` / `AuditLogService` / `InstallService` |
| SPI | `AppEntitySpi` / `UserEntitySpi` / `RoleEntitySpi` / `AppTypeEntitySpi` + `SpiEventBus` + 监听器接口 |
| 查询 | `PaginationX` / `PaginationQueryDto` / `WhereBuilder` / `QueryBuilderHelper` / `executeRawSql` |
| 权限工具 | `registerPermissionValues` / `buildPerValue` / `getPermValue` / `parsePerValue` / `hasPermission` / `getPermissionOptions` |
| 缓存 | `CACHE_SERVICE` / `REDIS_ONLY_SERVICE` / `CacheTTL` / `RateLimit` |
| 其他 | `hashPassword` / `verifyPassword` / `runSeeds` / `seedDicts` / `syncAppTypesConfig` |## 文档导航

- [应用工厂与配置](./app-factory.md)
- [装饰器](./decorators.md)
- [守卫·过滤器·拦截器](./guards-filters-interceptors.md)
- [权限体系](./permissions.md)
- [SPI 集成](./spi.md)
- [分页与查询](./pagination-query.md)
- [实体与服务](./entities-services.md)
- [缓存](./cache.md)
- [上传与 OSS](./upload.md)
- [内置系统 API](./sys-apis.md)
- [使用规范](./conventions.md)

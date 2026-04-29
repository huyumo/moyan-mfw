# 审计拦截器数据库写入设计文档

> 创建日期：2026-04-29
> 状态：待实现
> 作者：AI Assistant

## 1. 背景与目标

### 1.1 现状

项目中已有完整的审计日志模块：
- 数据库实体：`AuditLog` (`sys_audit_logs` 表)
- 服务层：`AuditLogService`（提供 `create`, `findAll`, `findById` 等方法）
- 控制器：`AuditLogController`（提供查询、删除等 REST API）
- 装饰器：`@AuditLog`（标记需要记录审计日志的接口）
- 拦截器：`AuditInterceptor`（拦截标记接口，但**仅打印日志，未写入数据库**）

### 1.2 问题

`AuditInterceptor` 中存在 TODO 标记：
```typescript
// TODO: 将审计日志写入数据库
// this.auditLogService.create(logData);
```

当前拦截器仅通过 `Logger.log()` 输出到控制台，审计数据未持久化。

### 1.3 目标

让 `AuditInterceptor` 真正将审计日志写入数据库，实现完整的审计追踪功能。

## 2. 技术方案

### 2.1 方案选择：依赖注入 AuditLogService

采用方案 1：在拦截器中注入 `AuditLogService`，直接调用服务层方法写入数据库。

**选择理由：**
- 实现简单，代码改动最小
- 直接复用现有的 `AuditLogService`
- 符合 NestJS 全局拦截器最佳实践
- 后续可扩展为异步队列或事件驱动

### 2.2 核心改造点

#### 2.2.1 修改 AuditInterceptor

**改造前：**
```typescript
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // ... 收集日志数据
    return next.handle().pipe(
      tap(() => {
        // TODO: 将审计日志写入数据库
        this.logger.log(`[AUDIT] ...`);
      }),
    );
  }
}
```

**改造后：**
```typescript
import { Injectable, Logger, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, from } from 'rxjs';
import { mergeMap, catchError, tap } from 'rxjs/operators';
import { AUDIT_LOG, AuditLogOptions } from '../decorators/audit-log.decorator';
import { AuditLogService } from '../../modules/sys/audit-log/audit-log.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private reflector: Reflector,
    private auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 支持方法级别和类级别的 @AuditLog 装饰器
    const auditLog = this.reflector.get<AuditLogOptions>(
      AUDIT_LOG,
      context.getHandler(),
    ) || this.reflector.get<AuditLogOptions>(
      AUDIT_LOG,
      context.getClass(),
    );

    // 如果没有标记 @AuditLog，直接跳过
    if (!auditLog) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const now = Date.now();

    return next.handle().pipe(
      mergeMap((response) => {
        const executionTime = Date.now() - now;
        
        // 使用 from 包装 Promise，确保异步操作被正确等待
        return from(
          this.writeAuditLog(auditLog, user, request, executionTime)
        ).pipe(
          tap(() => {
            this.logger.log(
              `[AUDIT] ${auditLog.module}.${auditLog.event} - ${user?.username || 'anonymous'} - ${executionTime}ms`,
            );
          }),
          catchError((error) => {
            this.logger.error(
              `[AUDIT ERROR] ${auditLog.module}.${auditLog.event} - ${error.message}`,
              error.stack,
            );
            // 返回原始响应，确保主流程不受影响
            return of(response);
          }),
        );
      }),
    );
  }

  private async writeAuditLog(
    auditLog: AuditLogOptions,
    user: any,
    request: any,
    executionTime: number,
  ): Promise<void> {
    await this.auditLogService.create({
      module: auditLog.module,
      event: auditLog.event,
      description: auditLog.description || '', // 处理可选字段
      operatorId: user?.id || 'anonymous',
      operatorName: user?.username || 'anonymous',
      targetId: null, // Phase 2: 从响应中提取
      targetType: '', // Phase 2: 从响应中提取
      ip: request.ip || '',
      userAgent: request.headers['user-agent'] || '',
    });
  }
}
```

**关键改进：**
1. 使用 `mergeMap` + `from` 处理异步操作，避免 `tap` 的 RxJS 陷阱
2. 使用 `catchError` 确保异常不影响主流程
3. 支持方法级别和类级别的装饰器
4. 为可选字段提供默认值（`description || ''`）

#### 2.2.2 修改 AuditLogModule

在 `AuditLogModule` 中注册拦截器，使用 `APP_INTERCEPTOR` 令牌：

**改造前：**
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditLogService],
  controllers: [AuditLogController],
  exports: [AuditLogService],
})
export class AuditLogModule {}
```

**改造后：**
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [
    AuditLogService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  controllers: [AuditLogController],
  exports: [AuditLogService],
})
export class AuditLogModule {}
```

**关键改进：**
1. 使用 `APP_INTERCEPTOR` 令牌注册，符合 NestJS 最佳实践
2. 利用完整的 DI 生命周期
3. 无需在 `create-base-backend-app.ts` 中手动实例化

#### 2.2.3 移除 create-base-backend-app.ts 中的手动注册

由于拦截器已在 `AuditLogModule` 中注册，需要从全局拦截器列表中移除：

**改造前：**
```typescript
app.useGlobalInterceptors(
  new LoggingInterceptor(),
  new TransformInterceptor(),
  new AuditInterceptor(app.get(Reflector)), // 移除这一行
);
```

**改造后：**
```typescript
app.useGlobalInterceptors(
  new LoggingInterceptor(),
  new TransformInterceptor(),
  // AuditInterceptor 已在 AuditLogModule 中通过 APP_INTERCEPTOR 注册
);
```

### 2.3 异常处理策略

- 审计日志写入失败时，仅记录错误日志，不抛出异常
- 确保主业务流程不受影响
- 使用 `catchError` 操作符捕获并处理异常
- 统一日志格式：`[AUDIT ERROR] module.event - message`

### 2.4 性能考虑

- 使用 `mergeMap` + `from` 确保异步操作被正确等待
- 当前采用同步写入，确保数据可靠性
- 后续如遇到性能瓶颈，可改为异步写入或使用消息队列

### 2.5 装饰器反射策略

- 支持方法级别和类级别的 `@AuditLog` 装饰器
- 使用 `reflector.get()` 回退机制：先检查方法级别，再检查类级别

## 3. 数据流

```
HTTP 请求
  → AuthGuard（解析用户信息到 request.user）
  → Controller 方法执行
  → @AuditLog 装饰器标记
  → AuditInterceptor 拦截
    → 收集请求数据（operator, ip, userAgent）
    → 执行 Controller 方法（next.handle()）
    → 获取响应数据
    → 构建审计日志对象
    → 调用 AuditLogService.create() 写入数据库
    → 异常捕获（写入失败不影响主流程）
  → 返回响应
```

## 4. 影响范围

### 4.1 修改文件

| 文件 | 改动内容 |
|------|----------|
| `src/common/interceptors/audit.interceptor.ts` | 注入 AuditLogService，使用 mergeMap + from 处理异步，添加 catchError |
| `src/modules/sys/audit-log/audit-log.module.ts` | 通过 APP_INTERCEPTOR 注册拦截器 |
| `src/create-base-backend-app.ts` | 移除手动注册 AuditInterceptor |
| `tests/setup/test-app.factory.ts` | 移除手动注册 AuditInterceptor（由模块自动注册） |

### 4.2 不需要修改的文件

- `AuditLogService` - 已有完整的 `create` 方法
- `AuditLog` 实体 - 字段已满足需求
- `AuditLogController` - 查询接口不变
- 所有使用 `@AuditLog` 装饰器的控制器 - 无需改动

## 5. 测试策略

### 5.1 单元测试

- 测试拦截器正常写入审计日志
- 测试写入失败时不影响主流程
- 测试未标记 `@AuditLog` 的接口不写入

### 5.2 集成测试

- 调用标记 `@AuditLog` 的接口，验证数据库中有审计记录
- 验证审计日志字段正确（operatorId, module, event 等）
- 验证查询审计日志接口返回正确数据

## 6. 后续扩展

### 6.1 快照数据（Phase 2）

当前不实现 request/response body 快照，后续可添加：
- 记录请求参数（`request.body`）
- 记录响应数据
- 构建 `snapshot: { before, after }` 对象

### 6.2 异步队列（Phase 3）

如遇到性能瓶颈，可引入消息队列：
- 使用 Bull + Redis
- 拦截器推入队列
- 后台 worker 批量写入

### 6.3 事件驱动（Phase 4）

使用 NestJS EventEmitter 解耦：
- 拦截器触发 `audit.log` 事件
- 独立监听器处理写入

## 7. 验收标准

- [ ] 调用标记 `@AuditLog` 的接口后，数据库 `sys_audit_logs` 表中有新记录
- [ ] 审计日志字段正确（module, event, operatorId, operatorName, ip, createAt）
- [ ] 审计日志写入失败时，主业务流程不受影响
- [ ] 现有审计日志查询接口正常工作
- [ ] 集成测试通过

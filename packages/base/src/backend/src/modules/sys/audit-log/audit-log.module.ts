/**
 * @fileoverview 审计日志模块
 * @description 审计日志模块定义，包含审计日志服务和控制器
 */

import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { AuditInterceptor } from '../../../../common/interceptors/audit.interceptor';

/**
 * 审计日志模块
 * @description 提供审计日志管理相关功能
 */
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

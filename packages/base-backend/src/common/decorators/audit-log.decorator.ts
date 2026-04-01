/**
 * @fileoverview 审计日志装饰器
 * @description 标记需要记录审计日志的接口
 */

import { SetMetadata } from '@nestjs/common';

/**
 * 审计日志标识键
 */
export const AUDIT_LOG = 'audit_log';

/**
 * 审计日志模块枚举
 */
export enum AuditModule {
  AUTH = 'AUTH',
  USER = 'USER',
  ROLE = 'ROLE',
  PERMISSION = 'PERMISSION',
  APP = 'APP',
  APP_TYPE = 'APP_TYPE',
  MEMBER = 'MEMBER',
  SYSTEM = 'SYSTEM',
}

/**
 * 审计日志选项接口
 */
export interface AuditLogOptions {
  /** 所属模块 */
  module: AuditModule | string;
  /** 事件名称 */
  event: string;
  /** 事件描述 */
  description?: string;
}

/**
 * 审计日志装饰器
 * @description 标记控制器方法需要记录审计日志
 *
 * @param options - 审计日志选项
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @AuditLog({ module: AuditModule.USER, event: 'CREATE_USER', description: '创建用户' })
 *   @Post()
 *   async create(@Body() dto: CreateUserDto) {}
 * }
 * ```
 */
export const AuditLog = (options: AuditLogOptions) =>
  SetMetadata(AUDIT_LOG, options);

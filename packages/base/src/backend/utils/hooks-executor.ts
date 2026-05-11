/**
 * @fileoverview 钩子执行器
 */

import { INestApplication, Type } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HookConfig, AppContext } from '../types/app-config.types';

/**
 * 创建应用上下文
 */
export function createAppContext(
  app: INestApplication,
  dataSource: DataSource,
): AppContext {
  const configService = app.get(ConfigService);

  return {
    app,
    dataSource,
    configService,
    getService: <T>(type: Type<T>): T => app.get(type),
  };
}

/**
 * 执行钩子函数
 */
export async function executeHook(
  hookFn: ((ctx: AppContext, ...args: any[]) => Promise<void>) | undefined,
  ctx: AppContext,
  ...args: any[]
): Promise<void> {
  if (!hookFn) {
    return;
  }

  try {
    await hookFn(ctx, ...args);
  } catch (error) {
    console.error('[Hooks] Hook execution failed:', error);
    throw error;
  }
}

/**
 * 钩子执行器类
 */
export class HooksExecutor {
  private ctx: AppContext | null = null;
  private hooks: HookConfig;

  constructor(hooks: HookConfig = {}) {
    this.hooks = hooks;
  }

  /**
   * 初始化上下文
   */
  initContext(app: INestApplication, dataSource: DataSource): void {
    this.ctx = createAppContext(app, dataSource);
  }

  /**
   * 执行数据库就绪钩子
   */
  async onDatabaseReady(): Promise<void> {
    if (!this.ctx) return;
    await executeHook(this.hooks.onDatabaseReady, this.ctx);
  }

  /**
   * 执行应用初始化钩子
   */
  async onAppInit(): Promise<void> {
    if (!this.ctx) return;
    await executeHook(this.hooks.onAppInit, this.ctx);
  }

  /**
   * 执行登录前钩子
   */
  async beforeLogin(credentials: any): Promise<void> {
    if (!this.ctx) return;
    await executeHook(this.hooks.beforeLogin, this.ctx, credentials);
  }

  /**
   * 执行登录后钩子
   */
  async afterLogin(user: any, token: string): Promise<void> {
    if (!this.ctx) return;
    await executeHook(this.hooks.afterLogin, this.ctx, user, token);
  }

  /**
   * 执行注册后钩子
   */
  async afterRegister(user: any): Promise<void> {
    if (!this.ctx) return;
    await executeHook(this.hooks.afterRegister, this.ctx, user);
  }

  /**
   * 执行关闭前钩子
   */
  async beforeClose(): Promise<void> {
    if (!this.ctx) return;
    await executeHook(this.hooks.beforeClose, this.ctx);
  }
}
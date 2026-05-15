/**
 * @fileoverview 钩子执行器
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HookConfig, AppContext } from '../types/app-config.types';
/**
 * 创建应用上下文
 */
export declare function createAppContext(app: INestApplication, dataSource: DataSource): AppContext;
/**
 * 执行钩子函数
 */
export declare function executeHook(hookFn: ((ctx: AppContext, ...args: any[]) => Promise<void>) | undefined, ctx: AppContext, ...args: any[]): Promise<void>;
/**
 * 钩子执行器类
 */
export declare class HooksExecutor {
    private ctx;
    private hooks;
    constructor(hooks?: HookConfig);
    /**
     * 初始化上下文
     */
    initContext(app: INestApplication, dataSource: DataSource): void;
    /**
     * 执行数据库就绪钩子
     */
    onDatabaseReady(): Promise<void>;
    /**
     * 执行应用初始化钩子
     */
    onAppInit(): Promise<void>;
    /**
     * 执行登录前钩子
     */
    beforeLogin(credentials: any): Promise<void>;
    /**
     * 执行登录后钩子
     */
    afterLogin(user: any, token: string): Promise<void>;
    /**
     * 执行注册后钩子
     */
    afterRegister(user: any): Promise<void>;
    /**
     * 执行关闭前钩子
     */
    beforeClose(): Promise<void>;
}

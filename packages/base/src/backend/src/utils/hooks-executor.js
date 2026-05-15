"use strict";
/**
 * @fileoverview 钩子执行器
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HooksExecutor = void 0;
exports.createAppContext = createAppContext;
exports.executeHook = executeHook;
const config_1 = require("@nestjs/config");
/**
 * 创建应用上下文
 */
function createAppContext(app, dataSource) {
    const configService = app.get(config_1.ConfigService);
    return {
        app,
        dataSource,
        configService,
        getService: (type) => app.get(type),
    };
}
/**
 * 执行钩子函数
 */
async function executeHook(hookFn, ctx, ...args) {
    if (!hookFn) {
        return;
    }
    try {
        await hookFn(ctx, ...args);
    }
    catch (error) {
        console.error('[Hooks] Hook execution failed:', error);
        throw error;
    }
}
/**
 * 钩子执行器类
 */
class HooksExecutor {
    ctx = null;
    hooks;
    constructor(hooks = {}) {
        this.hooks = hooks;
    }
    /**
     * 初始化上下文
     */
    initContext(app, dataSource) {
        this.ctx = createAppContext(app, dataSource);
    }
    /**
     * 执行数据库就绪钩子
     */
    async onDatabaseReady() {
        if (!this.ctx)
            return;
        await executeHook(this.hooks.onDatabaseReady, this.ctx);
    }
    /**
     * 执行应用初始化钩子
     */
    async onAppInit() {
        if (!this.ctx)
            return;
        await executeHook(this.hooks.onAppInit, this.ctx);
    }
    /**
     * 执行登录前钩子
     */
    async beforeLogin(credentials) {
        if (!this.ctx)
            return;
        await executeHook(this.hooks.beforeLogin, this.ctx, credentials);
    }
    /**
     * 执行登录后钩子
     */
    async afterLogin(user, token) {
        if (!this.ctx)
            return;
        await executeHook(this.hooks.afterLogin, this.ctx, user, token);
    }
    /**
     * 执行注册后钩子
     */
    async afterRegister(user) {
        if (!this.ctx)
            return;
        await executeHook(this.hooks.afterRegister, this.ctx, user);
    }
    /**
     * 执行关闭前钩子
     */
    async beforeClose() {
        if (!this.ctx)
            return;
        await executeHook(this.hooks.beforeClose, this.ctx);
    }
}
exports.HooksExecutor = HooksExecutor;
//# sourceMappingURL=hooks-executor.js.map
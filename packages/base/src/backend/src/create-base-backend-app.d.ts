/**
 * @fileoverview 基础后端应用创建入口
 */
import { CreateBaseBackendAppOptions, BaseBackendAppInstance } from './types/app-config.types';
/**
 * 创建后端应用实例
 */
export declare function createBaseBackendApp(options?: CreateBaseBackendAppOptions): Promise<BaseBackendAppInstance>;
export type { CreateBaseBackendAppOptions, BaseBackendAppInstance, AppTypeConfig, RoleConfig, HookConfig, AppContext, DatabaseConfig, RedisConfig, JwtConfig, SwaggerGroupConfig, } from './types/app-config.types';

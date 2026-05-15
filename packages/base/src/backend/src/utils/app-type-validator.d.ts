/**
 * @fileoverview 应用类型验证器
 */
import { AppTypeConfig } from '../types/app-config.types';
/** 内置应用类型 typeCode */
export declare const BUILTIN_APP_TYPES: string[];
/**
 * 验证使用者配置的应用类型是否与内置类型冲突
 */
export declare function validateAppTypes(userAppTypes: AppTypeConfig[]): void;
/**
 * 验证内置角色中有且仅有一个拥有者角色
 */
export declare function validateOwnerRole(appType: AppTypeConfig): void;
/**
 * 获取内置应用类型配置
 */
export declare function getBuiltinAppTypes(): AppTypeConfig[];

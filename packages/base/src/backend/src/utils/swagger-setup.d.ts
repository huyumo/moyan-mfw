/**
 * @fileoverview Swagger 多文档分组配置工具
 */
import { INestApplication } from '@nestjs/common';
import { SwaggerGroupConfig } from '../types/app-config.types';
/**
 * 设置 Swagger 多文档分组
 */
export declare function setupSwaggerGroups(app: INestApplication, groups?: SwaggerGroupConfig[], appName?: string, appVersion?: string): void;

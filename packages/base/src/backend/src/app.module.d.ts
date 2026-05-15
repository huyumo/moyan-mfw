/**
 * @fileoverview 根模块
 * @description 应用的根模块，导入和配置所有功能模块
 */
import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from './modules/sys/user/entities/user.entity';
import { Role } from './modules/sys/role/entities/role.entity';
import { UserRole } from './modules/sys/role/entities/user-role.entity';
import { Permission } from './modules/sys/permission/entities/permission.entity';
import { RolePermission } from './modules/sys/role/entities/role-permission.entity';
import { AppType } from './modules/sys/app-type/entities/app-type.entity';
import { AppTypePermissionEntity } from './modules/sys/app-type/entities/app-type-permission.entity';
import { App } from './modules/sys/app/entities/app.entity';
import { AppMember } from './modules/sys/app/entities/app-member.entity';
import { AuditLog } from './modules/sys/audit-log/entities/audit-log.entity';
import { PermissionValue } from './modules/sys/permission/entities/permission-value.entity';
declare const entities: (typeof User | typeof Permission | typeof Role | typeof UserRole | typeof App | typeof AppMember | typeof AppType | typeof AppTypePermissionEntity | typeof RolePermission | typeof AuditLog | typeof PermissionValue)[];
/**
 * 数据库连接健康检查服务
 */
export declare class DatabaseHealthService implements OnModuleInit, OnModuleDestroy {
    private dataSource;
    private healthCheckInterval;
    private readonly healthCheckIntervalMs;
    constructor(dataSource: DataSource);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
/**
 * 数据库配置工厂函数
 */
declare function createTypeOrmOptions(configService: ConfigService): TypeOrmModuleOptions;
/**
 * 根模块
 */
export declare class AppModule {
}
export { createTypeOrmOptions, entities };

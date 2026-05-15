"use strict";
/**
 * @fileoverview 根模块
 * @description 应用的根模块，导入和配置所有功能模块
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.entities = exports.AppModule = exports.DatabaseHealthService = void 0;
exports.createTypeOrmOptions = createTypeOrmOptions;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_2 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const typeorm_2 = require("typeorm");
// 配置
const config_3 = require("./config");
// 实体 - 直接导入确保打包后可用
const user_entity_1 = require("./modules/sys/user/entities/user.entity");
const role_entity_1 = require("./modules/sys/role/entities/role.entity");
const user_role_entity_1 = require("./modules/sys/role/entities/user-role.entity");
const permission_entity_1 = require("./modules/sys/permission/entities/permission.entity");
const role_permission_entity_1 = require("./modules/sys/role/entities/role-permission.entity");
const app_type_entity_1 = require("./modules/sys/app-type/entities/app-type.entity");
const app_type_permission_entity_1 = require("./modules/sys/app-type/entities/app-type-permission.entity");
const app_entity_1 = require("./modules/sys/app/entities/app.entity");
const app_member_entity_1 = require("./modules/sys/app/entities/app-member.entity");
const audit_log_entity_1 = require("./modules/sys/audit-log/entities/audit-log.entity");
const permission_value_entity_1 = require("./modules/sys/permission/entities/permission-value.entity");
// 业务模块
const sys_module_1 = require("./modules/sys/sys.module");
const health_module_1 = require("./modules/health/health.module");
// 守卫
const auth_guard_1 = require("./common/guards/auth.guard");
const permission_guard_1 = require("./common/guards/permission.guard");
// 所有实体数组
const entities = [user_entity_1.User, role_entity_1.Role, user_role_entity_1.UserRole, permission_entity_1.Permission, role_permission_entity_1.RolePermission, app_type_entity_1.AppType, app_type_permission_entity_1.AppTypePermissionEntity, app_entity_1.App, app_member_entity_1.AppMember, audit_log_entity_1.AuditLog, permission_value_entity_1.PermissionValue];
exports.entities = entities;
/**
 * 数据库连接健康检查服务
 */
let DatabaseHealthService = class DatabaseHealthService {
    dataSource;
    healthCheckInterval = null;
    healthCheckIntervalMs = 30000; // 30 秒
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async onModuleInit() {
        console.log('[DatabaseHealth] Starting database connection health check...');
        // 定期检测连接状态
        this.healthCheckInterval = setInterval(async () => {
            try {
                await this.dataSource.query('SELECT 1');
            }
            catch (error) {
                console.error('[DatabaseHealth] Connection health check failed, attempting to reconnect...', error);
                // 尝试重新建立连接
                try {
                    if (this.dataSource.isInitialized) {
                        await this.dataSource.destroy();
                    }
                    await this.dataSource.initialize();
                    console.log('[DatabaseHealth] Reconnected successfully');
                }
                catch (reconnectError) {
                    console.error('[DatabaseHealth] Reconnection failed:', reconnectError);
                }
            }
        }, this.healthCheckIntervalMs);
    }
    async onModuleDestroy() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
            console.log('[DatabaseHealth] Stopped health check');
        }
    }
};
exports.DatabaseHealthService = DatabaseHealthService;
exports.DatabaseHealthService = DatabaseHealthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], DatabaseHealthService);
/**
 * 数据库配置工厂函数
 */
function createTypeOrmOptions(configService) {
    // 尝试从配置服务获取，如果失败则使用环境变量
    const dbConfig = configService.get('databaseConfig') || configService.get('database') || {};
    console.log('Database config loaded from service:', dbConfig?.database);
    console.log('DB_NAME from env:', process.env.DB_NAME);
    return {
        type: 'mysql',
        host: dbConfig?.host || process.env.DB_HOST || '127.0.0.1',
        port: dbConfig?.port || parseInt(process.env.DB_PORT || '3306', 10),
        username: dbConfig?.username || process.env.DB_USERNAME || 'moyan_mfw',
        password: dbConfig?.password || process.env.DB_PASSWORD || 'moyan_mfw',
        database: dbConfig?.database || process.env.DB_NAME || 'moyan_mfw',
        charset: dbConfig?.charset || 'utf8mb4',
        timezone: dbConfig?.timezone || '+08:00',
        poolSize: dbConfig?.poolSize || 100,
        // 测试环境启用 synchronize 以自动创建表（不 dropSchema，由 global-setup 管理）
        synchronize: dbConfig?.synchronize ?? (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development'),
        dropSchema: false,
        logging: dbConfig?.logging ?? false,
        // 使用直接导入的实体数组，而不是 glob 模式
        entities: entities,
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        // 数据库连接重试机制
        connectTimeout: 60000, // 连接超时 60 秒
        acquireTimeout: 60000, // 获取连接超时 60 秒
        // 空闲连接回收
        idleTimeoutMillis: 60000, // 空闲连接 60 秒后回收
        // 启用日志
        logger: 'advanced-console',
        extra: {
            connectionLimit: dbConfig?.poolSize || 100,
            waitForConnections: true,
            queueLimit: 0,
            // 连接池心跳配置（mysql2 原生支持）
            enableKeepAlive: true,
            keepAliveInitialDelay: 30000, // 30 秒发送一次心跳
            // 支持大数字
            supportBigNumbers: true,
            bigNumberStrings: false,
            // 时区配置
            timezone: 'Z',
            // 允许多条 SQL 语句执行
            multipleStatements: true,
        },
        // 自动重连
        autoLoadEntities: false,
        keepConnectionAlive: true,
        // 错误重试
        retryAttempts: 10,
        retryDelay: 3000, // 3 秒
    };
}
/**
 * 根模块
 */
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            // 配置模块
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env.local', '.env'],
                load: [config_3.databaseConfig, config_3.appConfig, config_3.redisConfig, config_3.userConfig],
                ignoreEnvFile: false,
            }),
            // TypeORM 配置
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: createTypeOrmOptions,
                inject: [config_2.ConfigService],
            }),
            // JWT 配置
            jwt_1.JwtModule.registerAsync({
                global: true,
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    secret: configService.get('JWT_SECRET', 'default_jwt_secret'),
                    signOptions: {
                        expiresIn: configService.get('JWT_EXPIRES_IN', 7200),
                    },
                }),
                inject: [config_2.ConfigService],
            }),
            // 业务模块
            sys_module_1.SysModule,
            health_module_1.HealthModule,
        ],
        providers: [
            DatabaseHealthService,
            {
                provide: core_1.APP_GUARD,
                useFactory: (jwtService, reflector) => {
                    return new auth_guard_1.AuthGuard(jwtService, reflector);
                },
                inject: [jwt_1.JwtService, core_1.Reflector],
            },
            {
                provide: core_1.APP_GUARD,
                useFactory: (reflector, dataSource) => {
                    const rolePermissionRepository = dataSource.getRepository(role_permission_entity_1.RolePermission);
                    const userRoleRepository = dataSource.getRepository(user_role_entity_1.UserRole);
                    return new permission_guard_1.PermissionGuard(reflector, rolePermissionRepository, userRoleRepository);
                },
                inject: [core_1.Reflector, typeorm_2.DataSource],
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
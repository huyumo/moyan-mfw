"use strict";
/**
 * @fileoverview 基础后端应用创建入口
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBaseBackendApp = createBaseBackendApp;
const dotenv_1 = require("dotenv");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const path = __importStar(require("path"));
const app_type_validator_1 = require("./utils/app-type-validator");
const swagger_setup_1 = require("./utils/swagger-setup");
const hooks_executor_1 = require("./utils/hooks-executor");
const common_2 = require("./common");
const config_2 = require("./config");
const app_module_1 = require("./app.module");
const auth_guard_1 = require("./common/guards/auth.guard");
const permission_guard_1 = require("./common/guards/permission.guard");
const role_permission_entity_1 = require("./modules/sys/role/entities/role-permission.entity");
const user_role_entity_1 = require("./modules/sys/role/entities/user-role.entity");
const permission_value_sync_service_1 = require("./modules/sys/permission/permission-value-sync.service");
(0, dotenv_1.config)({ path: '.env' });
/**
 * 创建后端应用实例
 */
async function createBaseBackendApp(options = {}) {
    if (options.permissionValues && options.permissionValues.length > 0) {
        (0, common_2.registerPermissionValues)(options.permissionValues);
    }
    (0, app_type_validator_1.validateAppTypes)(options.appTypes || []);
    const allAppTypes = [...(0, app_type_validator_1.getBuiltinAppTypes)(), ...(options.appTypes || [])];
    const DynamicAppModule = await createDynamicAppModule(options, allAppTypes);
    const app = await core_1.NestFactory.create(DynamicAppModule);
    setupBigIntSerialization(app);
    const configService = app.get(config_1.ConfigService);
    setupStaticFiles(app, configService);
    const globalPrefix = configService.get('globalPrefix', '/api');
    app.setGlobalPrefix(globalPrefix);
    app.useGlobalFilters(new common_2.AllExceptionsFilter());
    app.useGlobalInterceptors(new common_2.LoggingInterceptor(), new common_2.TransformInterceptor());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    setupCors(app, options, configService);
    (0, swagger_setup_1.setupSwaggerGroups)(app, options.swagger || [], options.name || configService.get('appName', 'Moyan MFW Backend'), '1.0.0');
    const dataSource = app.get(typeorm_2.DataSource);
    const hooksExecutor = new hooks_executor_1.HooksExecutor(options.hooks || {});
    hooksExecutor.initContext(app, dataSource);
    await hooksExecutor.onDatabaseReady();
    try {
        const syncService = app.get(permission_value_sync_service_1.PermissionValueSyncService);
        await syncService.sync(dataSource);
    }
    catch (error) {
        if (error.message?.includes('ER_NO_SUCH_TABLE')) {
            process.stdout.write('⏳ sys_permission_values 表未创建，跳过权限值同步\n');
        }
        else {
            process.stdout.write(`⚠️ 权限值同步失败: ${error.message}\n`);
        }
    }
    await hooksExecutor.onAppInit();
    // 根据配置决定是否同步应用类型（仅已初始化的系统才执行）
    if (options.syncAppTypes && allAppTypes.length > 0) {
        try {
            const appTypeRepo = dataSource.getRepository((await Promise.resolve().then(() => __importStar(require('./modules/sys/app-type/entities/app-type.entity')))).AppType);
            const isInitialized = (await appTypeRepo.count()) > 0;
            if (isInitialized) {
                const { syncAppTypesConfig } = await Promise.resolve().then(() => __importStar(require('./modules/sys/app-type/app-type-sync')));
                await syncAppTypesConfig(dataSource, allAppTypes);
            }
            else {
                process.stdout.write('⏳ 系统未初始化，跳过业务应用类型同步\n');
            }
        }
        catch (error) {
            if (error.message?.includes('ER_NO_SUCH_TABLE')) {
                process.stdout.write('⏳ 数据库表未创建，跳过业务应用类型同步\n');
            }
            else {
                throw error;
            }
        }
    }
    return {
        app,
        listen: async (port) => {
            await app.listen(port);
            printStartupMessage(port, globalPrefix, configService);
        },
        close: async () => {
            await hooksExecutor.beforeClose();
            await app.close();
        },
    };
}
/**
 * 创建动态应用模块
 */
async function createDynamicAppModule(options, allAppTypes) {
    const { Module } = await Promise.resolve().then(() => __importStar(require('@nestjs/common')));
    const { SysModule } = await Promise.resolve().then(() => __importStar(require('./modules/sys/sys.module')));
    const { HealthModule } = await Promise.resolve().then(() => __importStar(require('./modules/health/health.module')));
    let DynamicAppModule = class DynamicAppModule {
    };
    DynamicAppModule = __decorate([
        Module({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env.local', '.env'],
                    load: [config_2.databaseConfig, config_2.appConfig, config_2.redisConfig, config_2.userConfig, config_2.jwtConfig],
                    ignoreEnvFile: false,
                }),
                typeorm_1.TypeOrmModule.forRootAsync({
                    imports: [config_1.ConfigModule],
                    useFactory: (configService) => {
                        const dbConfig = options.database || configService.get('databaseConfig') || {};
                        return {
                            type: 'mysql',
                            host: dbConfig.host || process.env.DB_HOST || 'localhost',
                            port: dbConfig.port || parseInt(process.env.DB_PORT || '3306', 10),
                            username: dbConfig.username || process.env.DB_USERNAME,
                            password: dbConfig.password || process.env.DB_PASSWORD,
                            database: dbConfig.database || process.env.DB_NAME,
                            charset: dbConfig.charset || 'utf8mb4',
                            timezone: dbConfig.timezone || '+08:00',
                            poolSize: dbConfig.poolSize || 100,
                            synchronize: dbConfig.synchronize ?? (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'),
                            logging: dbConfig.logging ?? false,
                            entities: [...app_module_1.entities, ...(options.extraEntities || [])],
                            extra: {
                                multipleStatements: true,
                            },
                            keepConnectionAlive: true,
                            retryAttempts: 10,
                            retryDelay: 3000,
                        };
                    },
                    inject: [config_1.ConfigService],
                }),
                jwt_1.JwtModule.register({
                    global: true,
                    secret: options.jwt?.secret || process.env.JWT_SECRET || '',
                    signOptions: {
                        expiresIn: options.jwt?.expiresIn || 7200,
                    },
                }),
                SysModule,
                HealthModule,
                ...(options.modules || []),
            ],
            providers: [
                app_module_1.DatabaseHealthService,
                {
                    provide: 'APP_GUARD',
                    useFactory: (jwtService, reflector) => {
                        return new auth_guard_1.AuthGuard(jwtService, reflector);
                    },
                    inject: [jwt_1.JwtService, core_1.Reflector],
                },
                {
                    provide: 'APP_GUARD',
                    useFactory: (reflector, dataSource) => {
                        const rolePermissionRepository = dataSource.getRepository(role_permission_entity_1.RolePermission);
                        const userRoleRepository = dataSource.getRepository(user_role_entity_1.UserRole);
                        return new permission_guard_1.PermissionGuard(reflector, rolePermissionRepository, userRoleRepository);
                    },
                    inject: [core_1.Reflector, typeorm_2.DataSource],
                },
                ...(options.providers || []),
            ],
        })
    ], DynamicAppModule);
    return DynamicAppModule;
}
/**
 * 配置 BigInt 序列化
 */
function setupBigIntSerialization(app) {
    app.use((_req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = (data) => {
            return originalJson(JSON.parse(JSON.stringify(data, (_key, value) => typeof value === 'bigint' ? value.toString() : value)));
        };
        next();
    });
}
/**
 * 配置静态文件服务
 */
function setupStaticFiles(app, configService) {
    const uploadDir = configService.get('UPLOAD_DIR', 'uploads');
    const absoluteUploadDir = path.resolve(uploadDir);
    app.useStaticAssets(absoluteUploadDir, { prefix: '/uploads/' });
}
/**
 * 配置 CORS
 */
function setupCors(app, options, configService) {
    const corsConfig = options.cors ?? configService.get('cors');
    if (corsConfig !== false) {
        app.enableCors(corsConfig === true ? undefined : corsConfig);
    }
}
/**
 * 打印启动消息
 */
function printStartupMessage(port, globalPrefix, configService) {
    console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🚀 Moyan MFW Backend is running!                        ║
  ║                                                           ║
  ║   ➜  Local:    http://localhost:${port}${globalPrefix}           ║
  ║   ➜  Swagger:  http://localhost:${port}/api-docs/sys            ║
  ║   ➜  Environment: ${configService.get('env', 'development')}                    ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
}
//# sourceMappingURL=create-base-backend-app.js.map
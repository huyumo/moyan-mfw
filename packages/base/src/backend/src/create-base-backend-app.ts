/**
 * @fileoverview 基础后端应用创建入口
 */

import { config } from 'dotenv';
import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { ValidationPipe, Type } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response, NextFunction } from 'express';
import * as path from 'path';

import {
  CreateBaseBackendAppOptions,
  BaseBackendAppInstance,
  DatabaseConfig,
  JwtConfig,
} from './types/app-config.types';
import { validateAppTypes, getBuiltinAppTypes } from './utils/app-type-validator';
import { setupSwaggerGroups } from './utils/swagger-setup';
import { HooksExecutor, createAppContext } from './utils/hooks-executor';
import { AllExceptionsFilter, LoggingInterceptor, TransformInterceptor, registerPermissionValues } from './common';
import { databaseConfig, appConfig, redisConfig, userConfig, jwtConfig } from './config';
import { AppModule, DatabaseHealthService, createTypeOrmOptions, entities } from './app.module';
import { AuthGuard } from './common/guards/auth.guard';
import { PermissionGuard } from './common/guards/permission.guard';
import { RolePermission } from './modules/sys/role/entities/role-permission.entity';
import { UserRole } from './modules/sys/role/entities/user-role.entity';
import { PermissionValueSyncService } from './modules/sys/permission/permission-value-sync.service';

config({ path: '.env' });

/**
 * 创建后端应用实例
 */
export async function createBaseBackendApp(
  options: CreateBaseBackendAppOptions = {},
): Promise<BaseBackendAppInstance> {
  if (options.permissionValues && options.permissionValues.length > 0) {
    registerPermissionValues(options.permissionValues);
  }

  validateAppTypes(options.appTypes || []);

  const allAppTypes = [...getBuiltinAppTypes(), ...(options.appTypes || [])];

  const DynamicAppModule = await createDynamicAppModule(options, allAppTypes);

  const app = await NestFactory.create<NestExpressApplication>(DynamicAppModule);

  setupBigIntSerialization(app);

  const configService = app.get(ConfigService);

  setupStaticFiles(app, configService);

  const globalPrefix = configService.get<string>('globalPrefix', '/api');
  app.setGlobalPrefix(globalPrefix);

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  setupCors(app, options, configService);

  setupSwaggerGroups(
    app,
    options.swagger || [],
    options.name || configService.get<string>('appName', 'Moyan MFW Backend'),
    '1.0.0',
  );

  const dataSource = app.get(DataSource);
  const hooksExecutor = new HooksExecutor(options.hooks || {});
  hooksExecutor.initContext(app, dataSource);

  await hooksExecutor.onDatabaseReady();

  try {
    const syncService = app.get(PermissionValueSyncService);
    await syncService.sync(dataSource);
  } catch (error: any) {
    if (error.message?.includes('ER_NO_SUCH_TABLE')) {
      process.stdout.write('⏳ sys_permission_values 表未创建，跳过权限值同步\n');
    } else {
      process.stdout.write(`⚠️ 权限值同步失败: ${error.message}\n`);
    }
  }

  await hooksExecutor.onAppInit();

  // 根据配置决定是否同步应用类型（仅已初始化的系统才执行）
  if (options.syncAppTypes && allAppTypes.length > 0) {
    try {
      const appTypeRepo = dataSource.getRepository(
        (await import('./modules/sys/app-type/entities/app-type.entity')).AppType,
      );
      const isInitialized = (await appTypeRepo.count()) > 0;
      if (isInitialized) {
        const { syncAppTypesConfig } = await import('./modules/sys/app-type/app-type-sync');
        await syncAppTypesConfig(dataSource, allAppTypes);
      } else {
        process.stdout.write('⏳ 系统未初始化，跳过业务应用类型同步\n');
      }
    } catch (error: any) {
      if (error.message?.includes('ER_NO_SUCH_TABLE')) {
        process.stdout.write('⏳ 数据库表未创建，跳过业务应用类型同步\n');
      } else {
        throw error;
      }
    }
  }

  return {
    app,
    listen: async (port: number) => {
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
async function createDynamicAppModule(
  options: CreateBaseBackendAppOptions,
  allAppTypes: any[],
): Promise<any> {
  const { Module } = await import('@nestjs/common');
  const { SysModule } = await import('./modules/sys/sys.module');
  const { HealthModule } = await import('./modules/health/health.module');

  @Module({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env.local', '.env'],
        load: [databaseConfig, appConfig, redisConfig, userConfig, jwtConfig],
        ignoreEnvFile: false,
      }),
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const dbConfig = options.database || configService.get<any>('databaseConfig') || {};
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
            entities: [...entities, ...(options.extraEntities || [])],
            extra: {
              multipleStatements: true,
            },
            keepConnectionAlive: true,
            retryAttempts: 10,
            retryDelay: 3000,
          } as TypeOrmModuleOptions;
        },
        inject: [ConfigService],
      }),
      JwtModule.register({
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
      DatabaseHealthService,
      {
        provide: 'APP_GUARD',
        useFactory: (jwtService: JwtService, reflector: Reflector) => {
          return new AuthGuard(jwtService, reflector);
        },
        inject: [JwtService, Reflector],
      },
      {
        provide: 'APP_GUARD',
        useFactory: (reflector: Reflector, dataSource: DataSource) => {
          const rolePermissionRepository = dataSource.getRepository(RolePermission);
          const userRoleRepository = dataSource.getRepository(UserRole);
          return new PermissionGuard(reflector, rolePermissionRepository, userRoleRepository);
        },
        inject: [Reflector, DataSource],
      },
      ...(options.providers || []),
    ],
  })
  class DynamicAppModule {}

  return DynamicAppModule;
}

/**
 * 配置 BigInt 序列化
 */
function setupBigIntSerialization(app: NestExpressApplication): void {
  app.use((_req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = (data: any) => {
      return originalJson(
        JSON.parse(
          JSON.stringify(data, (_key, value) =>
            typeof value === 'bigint' ? value.toString() : value,
          ),
        ),
      );
    };
    next();
  });
}

/**
 * 配置静态文件服务
 */
function setupStaticFiles(app: NestExpressApplication, configService: ConfigService): void {
  const uploadDir = configService.get<string>('UPLOAD_DIR', 'uploads');
  const absoluteUploadDir = path.resolve(uploadDir);
  app.useStaticAssets(absoluteUploadDir, { prefix: '/uploads/' });
}

/**
 * 配置 CORS
 */
function setupCors(
  app: NestExpressApplication,
  options: CreateBaseBackendAppOptions,
  configService: ConfigService,
): void {
  const corsConfig = options.cors ?? configService.get('cors');
  if (corsConfig !== false) {
    app.enableCors(corsConfig === true ? undefined : corsConfig);
  }
}

/**
 * 打印启动消息
 */
function printStartupMessage(port: number, globalPrefix: string, configService: ConfigService): void {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🚀 Moyan MFW Backend is running!                        ║
  ║                                                           ║
  ║   ➜  Local:    http://localhost:${port}${globalPrefix}           ║
  ║   ➜  Swagger:  http://localhost:${port}/api-docs/sys            ║
  ║   ➜  Environment: ${configService.get<string>('env', 'development')}                    ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
}

// 导出类型
export type {
  CreateBaseBackendAppOptions,
  BaseBackendAppInstance,
  AppTypeConfig,
  RoleConfig,
  HookConfig,
  AppContext,
  DatabaseConfig,
  RedisConfig,
  JwtConfig,
  SwaggerGroupConfig,
} from './types/app-config.types';
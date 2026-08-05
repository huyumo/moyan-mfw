/**
 * @fileoverview 集成测试根模块
 * @description 仅用于 Jest 集成测试，与生产 DynamicAppModule 共用 buildTypeOrmOptions，避免数据库配置逻辑重复维护
 */

import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { DataSource } from "typeorm";

// 配置
import {
  databaseConfig,
  appConfig,
  redisConfig,
  userConfig,
  ossConfig,
} from "../../src/backend/src/config";

// 缓存
import { CacheModule } from "../../src/backend/src/cache/cache.module";
import type { CacheDriver } from "../../src/backend/src/cache/cache.module";
import { REDIS_ONLY_SERVICE } from "../../src/backend/src/cache/cache.module";
import { IRedisOnlyService } from "../../src/backend/src/cache/interfaces/cache-service.interface";
import { CacheInterceptor } from "../../src/backend/src/cache/interceptors/cache.interceptor";

// 共享基础设施
import { DatabaseHealthService } from "../../src/backend/src/database/database-health.service";
import { buildTypeOrmOptions } from "../../src/backend/src/database/typeorm-options";

// 业务模块
import { SysModule } from "../../src/backend/src/modules/sys/sys.module";
import { HealthModule } from "../../src/backend/src/modules/health/health.module";

// 守卫
import { AuthGuard } from "../../src/backend/src/common/guards/auth.guard";
import { PermissionGuard } from "../../src/backend/src/common/guards/permission.guard";
import { RolePermission } from "../../src/backend/src/modules/sys/role/entities/role-permission.entity";
import { UserRole } from "../../src/backend/src/modules/sys/role/entities/user-role.entity";

/**
 * 集成测试根模块
 * @description 复刻生产 DynamicAppModule 的注册结构，仅用于测试环境
 */
@Module({
  imports: [
    // 缓存模块
    CacheModule.forRoot({
      driver: (process.env.CACHE_DRIVER as CacheDriver) || "none",
    }),

    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV || "development"}`,
        ".env.local",
        ".env",
      ],
      load: [databaseConfig, appConfig, redisConfig, userConfig, ossConfig],
      ignoreEnvFile: false,
    }),

    // TypeORM 配置（复用共享构建函数，测试环境 NODE_ENV=test 时自动启用 synchronize）
    TypeOrmModule.forRootAsync({
      useFactory: () =>
        buildTypeOrmOptions({
          migrations: [
            __dirname + "/../../src/backend/src/database/migrations/*{.ts,.js}",
          ],
        }),
    }),

    // JWT 配置
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET", "default_jwt_secret"),
        signOptions: {
          expiresIn: configService.get("JWT_EXPIRES_IN", 7200),
        },
      }),
      inject: [ConfigService],
    }),

    // 业务模块
    SysModule,
    HealthModule,
  ],
  providers: [
    DatabaseHealthService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    {
      provide: APP_GUARD,
      useFactory: (
        jwtService: JwtService,
        reflector: Reflector,
        redis: IRedisOnlyService,
      ) => {
        return new AuthGuard(jwtService, reflector, redis);
      },
      inject: [JwtService, Reflector, REDIS_ONLY_SERVICE],
    },
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector, dataSource: DataSource) => {
        const rolePermissionRepository =
          dataSource.getRepository(RolePermission);
        const userRoleRepository = dataSource.getRepository(UserRole);
        return new PermissionGuard(
          reflector,
          rolePermissionRepository,
          userRoleRepository,
        );
      },
      inject: [Reflector, DataSource],
    },
  ],
})
export class TestAppModule {}

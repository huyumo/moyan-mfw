/**
 * @fileoverview 根模块
 * @description 应用的根模块，导入和配置所有功能模块
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';

// 配置
import { databaseConfig, appConfig, redisConfig } from './config';

// 实体 - 直接导入确保打包后可用
import { User } from './modules/sys/user/entities/user.entity';
import { Role } from './modules/sys/role/entities/role.entity';
import { UserRole } from './modules/sys/role/entities/user-role.entity';
import { Permission } from './modules/sys/permission/entities/permission.entity';
import { RolePermission } from './modules/sys/permission/entities/role-permission.entity';
import { AppType } from './modules/sys/app-type/entities/app-type.entity';
import { AppTypePermissionEntity } from './modules/sys/app-type/entities/app-type-permission.entity';
import { App } from './modules/sys/app/entities/app.entity';
import { AppMember } from './modules/sys/app/entities/app-member.entity';
import { AuditLog } from './modules/sys/audit-log/entities/audit-log.entity';

// 业务模块
import { AuthModule } from './modules/sys/auth/auth.module';
import { UserModule } from './modules/sys/user/user.module';
import { RoleModule } from './modules/sys/role/role.module';
import { PermissionModule } from './modules/sys/permission/permission.module';
import { AppTypeModule } from './modules/sys/app-type/app-type.module';
import { AppModule as SysAppModule } from './modules/sys/app/app.module';
import { MemberModule } from './modules/sys/member/member.module';
import { AuditLogModule } from './modules/sys/audit-log/audit-log.module';
import { HealthModule } from './modules/health/health.module';

// 守卫
import { AuthGuard } from './common/guards/auth.guard';
import { PermissionGuard } from './common/guards/permission.guard';

// 所有实体数组
const entities = [User, Role, UserRole, Permission, RolePermission, AppType, AppTypePermissionEntity, App, AppMember, AuditLog];

/**
 * 数据库配置工厂函数
 */
function createTypeOrmOptions(configService: ConfigService): TypeOrmModuleOptions {
  // 尝试从配置服务获取，如果失败则使用环境变量
  const dbConfig = configService.get<any>('databaseConfig') || configService.get('database') || {};
  console.log('Database config loaded from service:', dbConfig?.database);
  console.log('DB_NAME from env:', process.env.DB_NAME);

  return {
    type: 'mysql',
    host: dbConfig?.host || process.env.DB_HOST || '47.109.38.249',
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
    logging: dbConfig?.logging ?? (process.env.NODE_ENV === 'development'),
    // 使用直接导入的实体数组，而不是 glob 模式
    entities: entities,
    migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
    // 数据库连接重试机制
    connectTimeout: 60000, // 连接超时 60 秒
    acquireTimeout: 60000, // 获取连接超时 60 秒
    extra: {
      connectionLimit: dbConfig?.poolSize || 100,
      waitForConnections: true,
      queueLimit: 0,
      // 重试配置
      retry: {
        maxRetries: 5,
        delay: 3000, // 3 秒重试间隔
      },
    },
    // 自动重连
    autoLoadEntities: false,
    keepConnectionAlive: true,
  } as TypeOrmModuleOptions;
}

/**
 * 根模块
 */
@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env.local', '.env'],
      load: [databaseConfig, appConfig, redisConfig],
      ignoreEnvFile: false,
    }),

    // TypeORM 配置
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: createTypeOrmOptions,
      inject: [ConfigService],
    }),

    // JWT 配置（硬编码值用于测试）
    JwtModule.register({
      global: true,
      secret: 'test_jwt_secret_key_for_integration_testing_only',
      signOptions: {
        expiresIn: 7200,
      },
    }),

    // 业务模块
    AuthModule,
    UserModule,
    RoleModule,
    PermissionModule,
    AppTypeModule,
    SysAppModule,
    MemberModule,
    AuditLogModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useFactory: (jwtService: JwtService, reflector: Reflector) => {
        return new AuthGuard(jwtService, reflector);
      },
      inject: [JwtService, Reflector],
    },
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector, dataSource: DataSource) => {
        const rolePermissionRepository = dataSource.getRepository(RolePermission);
        return new PermissionGuard(reflector, rolePermissionRepository);
      },
      inject: [Reflector, DataSource],
    },
  ],
})
export class AppModule {}

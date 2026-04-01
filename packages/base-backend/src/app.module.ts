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

// 配置
import { databaseConfig, appConfig, redisConfig } from './config';

// 业务模块
import { AuthModule } from './modules/sys/auth/auth.module';
import { UserModule } from './modules/sys/user/user.module';
import { RoleModule } from './modules/sys/role/role.module';
import { PermissionModule } from './modules/sys/permission/permission.module';
import { AppTypeModule } from './modules/sys/app-type/app-type.module';
import { AppModule as SysAppModule } from './modules/sys/app/app.module';
import { MemberModule } from './modules/sys/member/member.module';
import { AuditLogModule } from './modules/sys/audit-log/audit-log.module';

// 守卫
import { AuthGuard } from './common/guards/auth.guard';
import { PermissionGuard } from './common/guards/permission.guard';

/**
 * 数据库配置工厂函数
 */
function createTypeOrmOptions(configService: ConfigService): TypeOrmModuleOptions {
  const dbConfig = configService.get('database');
  console.log('Database config loaded:', dbConfig?.database);

  return {
    type: 'mysql',
    host: dbConfig?.host || '47.109.38.249',
    port: dbConfig?.port || 3306,
    username: dbConfig?.username || 'moyan_mfw',
    password: dbConfig?.password || 'moyan_mfw',
    database: dbConfig?.database || 'moyan_mfw',
    charset: dbConfig?.charset || 'utf8mb4',
    timezone: dbConfig?.timezone || '+08:00',
    poolSize: dbConfig?.poolSize || 100,
    // 测试环境启用 synchronize 以自动创建表（不 dropSchema，由 global-setup 管理）
    synchronize: dbConfig?.synchronize || process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
    dropSchema: false,
    logging: dbConfig?.logging || false,
    entities: [__dirname + '/modules/sys/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
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
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}

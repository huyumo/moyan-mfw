/**
 * @fileoverview Swagger 多文档分组配置工具
 */

import { INestApplication, Type } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { SwaggerGroupConfig } from '../types/app-config.types';
import { AuthModule } from '../modules/sys/auth/auth.module';
import { UserModule } from '../modules/sys/user/user.module';
import { RoleModule } from '../modules/sys/role/role.module';
import { PermissionModule } from '../modules/sys/permission/permission.module';
import { AppTypeModule } from '../modules/sys/app-type/app-type.module';
import { AppModule as SysAppModule } from '../modules/sys/app/app.module';
import { AuditLogModule } from '../modules/sys/audit-log/audit-log.module';
import { InstallModule } from '../modules/sys/install/install.module';
import { UploadFileModule } from '../modules/sys/upload/upload.module';

const SYS_SWAGGER_MODULES = [
  AuthModule,
  UserModule,
  RoleModule,
  PermissionModule,
  AppTypeModule,
  SysAppModule,
  AuditLogModule,
  InstallModule,
  UploadFileModule,
];

const SYS_SWAGGER_CONFIG: SwaggerGroupConfig = {
  name: 'sys',
  title: '核心API文档',
  description: 'base-backend 内置模块 API',
  include: SYS_SWAGGER_MODULES,
};

/**
 * 设置 Swagger 多文档分组
 */
export function setupSwaggerGroups(
  app: INestApplication,
  groups: SwaggerGroupConfig[] = [],
  appName: string = 'Moyan MFW Backend',
  appVersion: string = '1.0.0',
): void {
  setupSwaggerDocument(app, SYS_SWAGGER_CONFIG, appName, appVersion);

  for (const group of groups) {
    setupSwaggerDocument(app, group, appName, appVersion);
  }
}

/**
 * 设置单个 Swagger 文档
 */
function setupSwaggerDocument(
  app: INestApplication,
  config: SwaggerGroupConfig,
  appName: string,
  appVersion: string,
): void {
  const builder = new DocumentBuilder()
    .setTitle(config.title)
    .setDescription(config.description || `${appName} - ${config.title}`)
    .setVersion(appVersion)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '请输入 JWT Token',
      },
      'Authorization',
    );

  const documentConfig = builder.build();

  const document = SwaggerModule.createDocument(app, documentConfig, {
    include: config.include,
    operationIdFactory: (controllerKey: string, methodKey: string) => {
      const controllerName = controllerKey.replace(/Controller$/, '');
      const methodName = methodKey.charAt(0).toUpperCase() + methodKey.slice(1);
      return `${controllerName}${methodName}`;
    },
  });

  SwaggerModule.setup(`api-docs/${config.name}`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  console.log(`[Swagger] Document "${config.name}" available at /api-docs/${config.name}`);
}
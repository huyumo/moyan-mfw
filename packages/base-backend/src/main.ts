/**
 * @fileoverview 应用入口文件
 * @description NestJS 应用启动入口
 */

import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter, LoggingInterceptor, TransformInterceptor, AuditInterceptor } from './common';

// 加载 .env 文件
config({ path: '.env' });

/**
 * 应用引导函数
 * @description 创建并配置 NestJS 应用实例
 */
async function bootstrap() {
  // 创建应用实例
  const app = await NestFactory.create(AppModule);

  // 全局处理 BigInt 序列化（避免 JSON.stringify 错误）
  // 在 Express response.json 中拦截
  app.use((_req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (data: any) => {
      return originalJson(
        JSON.parse(
          JSON.stringify(data, (_key, value) =>
            typeof value === 'bigint' ? value.toString() : value
          )
        )
      );
    };
    next();
  });

  // 获取配置服务
  const configService = app.get(ConfigService);

  // 全局前缀
  const globalPrefix = configService.get<string>('globalPrefix', '/api');
  app.setGlobalPrefix(globalPrefix);

  // 全局注册异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter());

  // 全局注册拦截器
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
    new AuditInterceptor(app.get(Reflector)),
  );

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动移除未声明的属性
      forbidNonWhitelisted: true, // 遇到未声明的属性时抛出错误
      transform: true, // 自动转换类型
      transformOptions: {
        enableImplicitConversion: true, // 启用隐式转换
      },
    }),
  );

  // CORS 配置
  const corsConfig = configService.get('cors');
  app.enableCors(corsConfig);

  // Swagger 文档配置
  const config = new DocumentBuilder()
    .setTitle(configService.get<string>('appName', 'Moyan MFW Backend'))
    .setDescription('墨焱管理后台基础框架 API 文档')
    .setVersion(configService.get<string>('appVersion', '1.0.0'))
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '请输入 JWT Token',
      },
      'Authorization',
    )
    .addTag('auth', '认证相关接口')
    .addTag('user', '用户相关接口')
    .addTag('role', '角色相关接口')
    .addTag('permission', '权限相关接口')
    .addTag('app-type', '应用类型相关接口')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => {
      // AuthController_login -> AuthLogin
      // moyan-api 会自动添加 Api 前缀，所以这里不需要 Api 前缀
      // 最终生成的类名：ApiAuthLogin
      const controllerName = controllerKey.replace(/Controller$/, '');
      const methodName = methodKey.charAt(0).toUpperCase() + methodKey.slice(1);
      return `${controllerName}${methodName}`;
    },
  });
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // 启动应用
  const port = configService.get<number>('port', 3000);
  await app.listen(port);

  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🚀 Moyan MFW Backend is running!                        ║
  ║                                                           ║
  ║   ➜  Local:    http://localhost:${port}${globalPrefix}           ║
  ║   ➜  Swagger:  http://localhost:${port}/api-docs                ║
  ║   ➜  Environment: ${configService.get<string>('env', 'development')}                    ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();

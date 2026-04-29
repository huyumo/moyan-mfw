/**
 * @fileoverview 测试应用工厂
 * @description 创建用于测试的 NestJS 应用实例
 */

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter, LoggingInterceptor, TransformInterceptor } from '../../src/common';
import request from 'supertest';

/**
 * 测试应用配置接口
 */
export interface TestAppConfig {
  /** 是否使用全局前缀 */
  useGlobalPrefix?: boolean;
  /** 是否使用全局异常过滤器 */
  useGlobalFilters?: boolean;
  /** 是否使用全局拦截器 */
  useGlobalInterceptors?: boolean;
  /** 是否使用验证管道 */
  useGlobalPipes?: boolean;
}

/**
 * 创建测试应用实例
 * @param config 测试应用配置
 * @returns 测试应用实例
 */
export async function createTestApp(
  config: TestAppConfig = {},
): Promise<INestApplication> {
  const {
    useGlobalPrefix = true,
    useGlobalFilters = true,
    useGlobalInterceptors = true,
    useGlobalPipes = true,
  } = config;

  // 创建测试模块
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  // 创建应用实例
  const app = moduleRef.createNestApplication();

  // 应用配置
  if (useGlobalPrefix) {
    app.setGlobalPrefix('/api');
  }

  if (useGlobalFilters) {
    app.useGlobalFilters(new AllExceptionsFilter());
  }

  if (useGlobalInterceptors) {
    app.useGlobalInterceptors(
      new LoggingInterceptor(),
      new TransformInterceptor(),
    );
  }

  if (useGlobalPipes) {
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
  }

  // 初始化应用
  await app.init();

  return app;
}

/**
 * 获取测试 Token
 * @param app NestJS 应用实例
 * @param username 用户名
 * @param password 密码
 * @returns JWT Token
 */
export async function getTestToken(
  app: INestApplication,
  username: string = 'admin',
  password: string = 'Admin@123',
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({
      username,
      password,
    });

  return response.body.data.accessToken;
}

/**
 * 创建 Supertest 客户端
 * @param app NestJS 应用实例
 * @returns Supertest 测试客户端
 */
export function createTestClient(app: INestApplication) {
  import('supertest').then((t) => t.default);
  return (app as any).getHttpServer();
}

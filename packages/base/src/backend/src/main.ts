/**
 * @fileoverview 应用入口文件
 * @description NestJS 应用启动入口（兼容模式）
 */

import { createBaseBackendApp } from './create-base-backend-app';

async function bootstrap() {
  const app = await createBaseBackendApp();
  await app.listen(3000);
}

bootstrap();
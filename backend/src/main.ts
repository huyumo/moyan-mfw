/**
 * @fileoverview 业务后端应用入口文件
 */

import { createBaseBackendApp, SwaggerGroupConfig } from 'moyan-base-backend';
import { appTypesConfig } from './app-types.config';
import { AppModule } from './app.modules';
import { SupplierModule } from './modules/supplier/supplier.module';
import './permissions';
import 'business-dict';

const swaggerGroups: SwaggerGroupConfig[] = [
  {
    name: 'supplier',
    title: '供应商API文档',
    description: '供应商管理相关 API',
    include: [SupplierModule],
  },
];

async function bootstrap() {
  const app = await createBaseBackendApp({
    name: '墨焱业务后端',
    appTypes: appTypesConfig,
    syncAppTypes: true,
    modules: [AppModule],
    swagger: swaggerGroups,
    hooks: {
      onAppInit: async (ctx) => {
        console.log('[Backend] 应用初始化完成');
      },
    },
  });

  await app.listen(3000);
}

bootstrap();
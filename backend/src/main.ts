/**
 * @fileoverview 业务后端应用入口文件
 */

import { createBaseBackendApp, SwaggerGroupConfig } from 'moyan-mfw-base/backend';
import { appTypesConfig } from './app-types.config';
import { AppModule } from './app.modules';
import { SupplierModule } from './modules/supplier/supplier.module';
import { AdModule } from 'moyan-mfw-extension-ad/backend';
import './permissions';
import 'moyan-mfw-business-dict';

const swaggerGroups: SwaggerGroupConfig[] = [
  {
    name: 'supplier',
    title: '供应商API文档',
    description: '供应商管理相关 API',
    include: [SupplierModule],
  },
  {
    name: 'ad-extension',
    title: '广告管理API文档',
    description: '广告位类型、广告位、广告内容管理 API',
    include: [AdModule],
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
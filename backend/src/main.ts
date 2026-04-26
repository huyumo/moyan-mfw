/**
 * @fileoverview 业务后端应用入口
 */

import { createBaseBackendApp } from 'moyan-base-backend';
import { appTypesConfig } from './app-types.config';
import { SupplierModule } from './modules/supplier/supplier.module';

async function bootstrap() {
  const app = await createBaseBackendApp({
    appTypes: appTypesConfig,
    modules: [SupplierModule],
    swagger: [
      {
        name: 'supplier',
        title: '供应商API',
        include: [SupplierModule],
      },
    ],
  });

  await app.listen(3000);
}

bootstrap();
/**
 * @fileoverview 业务后端应用入口文件
 */

import { createBaseBackendApp } from 'moyan-base-backend';
import { appTypesConfig } from './app-types.config';
import { AppModule } from './app.modules';
import './permissions';

async function bootstrap() {
  const app = await createBaseBackendApp({
    name: '墨焱业务后端',
    appTypes: appTypesConfig,
    modules: [AppModule],
    hooks: {
      onAppInit: async (ctx) => {
        console.log('[Backend] 应用初始化完成');
      },
    },
  });

  await app.listen(3000);
}

bootstrap();